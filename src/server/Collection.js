import {parse as parseXml} from "txml";
import {jsonClone, evalInScope, jsonEq} from "../utils/js-util.js";

let SQL_TYPES={
    "text": "text",
    "richtext": "text",
    "date": "date",
    "datetime": "datetime",
    "select": "text",
    "image": "text",
    "authmethod": "text",
    "roleselect": "text",
    "reference": "integer"
};

export default class Collection {
	constructor(id, conf, server) {
		this.id=id;
        this.fields={};
        this.listFields=[];
        this.role=conf.role;
        this.writeRole=conf.writeRole;
        this.server=server;

        if (this.role && this.server.roles.indexOf(this.role)<0)
            throw new Error("Unknown role: "+this.role);

        if (this.writeRole && this.server.roles.indexOf(this.writeRole)<0)
            throw new Error("Unknown write role: "+this.writeRole);

        this.roleLevel=this.server.roles.indexOf(this.role);
        this.writeRoleLevel=this.server.roles.indexOf(this.writeRole);

        if (this.writeRoleLevel<0)
            this.writeRoleLevel=0;

        if (this.writeRoleLevel<this.roleLevel)
            this.writeRoleLevel=this.roleLevel;
	}

    getType() {
        if (this.isView() && this.single)
            return "singleView";

        if (this.isView())
            return "view";

        return "table";
    }

	getSchema() {
		return {
			id: this.id,
            type: this.getType(),
        	fields: this.fields,
        	listFields: this.listFields,
        	roleLevel: this.roleLevel,
        	writeRoleLevel: this.writeRoleLevel
		}
	}

	async handleRequest(req, argv) {
        await this.server.assertRequestRoleLevel(req,this.roleLevel);

        // List.
		if (req.method=="GET" && argv.length==0) {
			let data=await this.server.db.findMany(
                this.getTableName(),
                await this.getWhere(req)
            );
            return Response.json(data,{headers:{"Content-Range": "0-2/2"}});
		}

		// Find.
		if (req.method=="GET" && argv.length==1) {
            let item=await this.server.db.findOne(
                this.getTableName(),
                {id: argv[0], ...await this.getWhere(req)}
            );

            if (!item)
                return new Response("Not found",{status: 404});

            return Response.json(item);
        }

        await this.server.assertRequestRoleLevel(req,this.writeRoleLevel);

        // Create.
        if (req.method=="POST" && argv.length==0) {
            let data=await this.server.getRequestFormData(req);
            return Response.json(await this.server.db.insert(
                this.getTableName(),
                {...data, ...await this.getWhere(req)}
            ));
        }

        // Update.
        if (req.method=="PUT" && argv.length==1) {
            let data=await this.server.getRequestFormData(req);
            return Response.json(await this.server.db.update(
                this.getTableName(),
                {id: argv[0], ...await this.getWhere(req)},
                {...data, ...await this.getWhere(req)}
            ));
        }

        // Delete.
        if (req.method=="DELETE" && argv.length==1) {
            return Response.json(await this.server.db.delete(
                this.getTableName(),
                {id: argv[0], ...await this.getWhere(req)},
            ));
        }
	}
}

export class TableCollection extends Collection {
    constructor(id, conf, server) {
        super(id, conf, server);

        let fieldEls=parseXml(conf.fields);
        for (let fieldEl of fieldEls) {
            for (let k in fieldEl.attributes)
                if (fieldEl.attributes[k]===null)
                    fieldEl.attributes[k]=true;

            if (fieldEl.attributes.listable)
                this.listFields.push(fieldEl.attributes.id);

            let type=fieldEl.tagName.toLowerCase();
            if (!SQL_TYPES[type])
                throw new Error("Unknown field type: "+type);

            if (type=="roleselect") {
                fieldEl.attributes.choices=this.server.conf.roles;
                fieldEl.attributes.role=true;
            }

            let el={
                type: type,
                sqlType: SQL_TYPES[type],
                ...fieldEl.attributes
            }

            if (fieldEl.children.length)
                el.children=fieldEl.children;

            this.fields[fieldEl.attributes.id]=el;
        }

        if (!this.listFields.length)
            this.listFields=Object.keys(this.fields);
    }

    getTableName() {
        return this.id;
    }

    isView() {
        return false;
    }

    getWhere() {
        return {};
    }
}

export class ViewCollection extends Collection {
    constructor(id, conf, server) {
        super(id, conf, server);

        if (this.server.collections[conf.from].isView())
            throw new Error("Can't create a view from a view");

        this.where=conf.where;
        this.from=conf.from;
        this.fields=jsonClone(this.server.collections[conf.from].fields);
        this.listFields=jsonClone(this.server.collections[conf.from].listFields);

        let exclude=conf.exclude;
        if (!exclude)
            exclude=[];

        for (let k in this.where)
            exclude.push(k);

        for (let ex of exclude) {
            if (this.listFields.includes(ex))
                this.listFields.splice(this.listFields.indexOf(ex),1);

            this.fields[ex].hidden=true;
        }

        this.single=conf.single;
    }

    getTableName() {
        return this.from;
    }

    isView() {
        return true;
    }

    async getWhere(req) {
        let userId=await this.server.getUserIdByRequest(req);
        let retWhere={};

        for (let k in this.where) {
            retWhere[k]=evalInScope("`"+this.where[k]+"`",{userId: userId});
        }

        return retWhere;
    }

    async handleRequest(req, argv) {
        if (this.getType()!="singleView")
            return await super.handleRequest(req,argv);

        await this.server.assertRequestRoleLevel(req,this.roleLevel);

        // Find.
        if (req.method=="GET" && jsonEq(argv,["single"])) {
            let item=await this.server.db.findOne(
                this.getTableName(),
                await this.getWhere(req)
            );

            if (!item)
                return Response.json({id: "single"});

            return Response.json({...item, id: "single"});
        }

        await this.server.assertRequestRoleLevel(req,this.writeRoleLevel);

        // Update.
        if (req.method=="PUT" && jsonEq(argv,["single"])) {
            let data=await this.server.getRequestFormData(req);
            delete data.id;
            let queryResult=await this.server.db.update(
                this.getTableName(),
                {...await this.getWhere(req)},
                {...data, ...await this.getWhere(req)}
            );

            if (!queryResult) {
                /*console.log("inserting...");
                console.log({...data, ...await this.getWhere(req)});*/
                queryResult=await this.server.db.insert(
                    this.getTableName(),
                    {...data, ...await this.getWhere(req)}
                );
            }

            return Response.json({...queryResult, id: "single"});
        }
    }
}
