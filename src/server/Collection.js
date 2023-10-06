import {parse as parseXml} from "txml";
import {jsonClone, jsonEq} from "../utils/js-util.js";

let SQL_TYPES={
    "text": "text",
    "richtext": "text",
    "date": "date",
    "datetime": "datetime",
    "select": "text",
    "image": "text",
    "authmethod": "text",
    "reference": "integer"
};

function arrayify(cand) {
    if (!cand)
        return [];

    if (!Array.isArray(cand))
        return [cand];

    return cand;
}

export default class Collection {
	constructor(id, conf, server) {
		this.id=id;
        this.fields={};
        this.listFields=[];
        this.server=server;

        if (!conf.access && !conf.readAccess) {
            conf.access="admin";
            conf.readAccess="public";
        }

        this.access=arrayify(conf.access);
        this.readAccess=[...this.access,...arrayify(conf.readAccess)];
        this.helperText=conf.helperText;
        this.recordRepresentation=conf.recordRepresentation;
        this.actions=conf.actions;

        if (!this.actions)
            this.actions=[];
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
            access: this.access,
            readAccess: this.readAccess,
            helperText: this.helperText,
            recordRepresentation: this.recordRepresentation,
            actions: this.actions
		}
	}

    filterItem=(item)=>{
        return item;
    }

	async handleRequest(req, argv) {
        let role=await this.server.getRoleByRequest(req);
        //console.log("role: "+role);

        if (!this.readAccess.includes(role))
            return new Response("Not authorized",{status: 403});

        // List.
		if (req.method=="GET" && argv.length==0) {
            let filter={};
            let u=new URL(req.url);
            let filterJson=u.searchParams.get("filter");
            if (filterJson)
                filter=JSON.parse(filterJson);

            if (filter.q) {
                filter[this.recordRepresentation+"~"]=filter.q;
                delete filter.q;
            }

            //console.log("filter: ",filter);

            let range;
            if (u.searchParams.get("range"))
                range=JSON.parse(u.searchParams.get("range"));

            //console.log("range: "+range);

            let options={range: range};
			let data=await this.server.db.findMany(
                this.getTableName(),
                {...filter, ...await this.getWhere(req)},
                options
            );

            //console.log("count: "+options.count);

            data=data.map(this.filterItem);

            return Response.json(data,{headers:{
                "Content-Range": `${options.range[0]}-${options.range[1]}/${options.count}`
            }});
		}

		// Find.
		if (req.method=="GET" && argv.length==1) {
            let item=await this.server.db.findOne(
                this.getTableName(),
                {id: argv[0], ...await this.getWhere(req)}
            );

            if (!item)
                return new Response("Not found",{status: 404});

            return Response.json(this.filterItem(item));
        }

        if (!this.access.includes(role))
            return new Response("Not authorized",{status: 403});

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
            let item=await this.server.db.findOne(
                this.getTableName(),
                {id: argv[0], ...await this.getWhere(req)}
            );

            if (!item)
                return new Response("Not found",{status: 404});

            let tableName=this.getTableName();
            let references=this.server.findReferencesForTable(tableName);
            for (let reference of references) {
                let query={};
                query[reference.fieldId]=argv[0];
                await this.server.db.delete(reference.collectionId,query);
            }

            await this.server.db.delete(this.getTableName(),{
                id: argv[0]
            });

            return Response.json(item);
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
            if (k!="id")
                exclude.push(k);

        for (let ex of exclude) {
            if (this.listFields.includes(ex))
                this.listFields.splice(this.listFields.indexOf(ex),1);

            delete this.fields[ex];
            //this.fields[ex].hidden=true;
        }

        if (conf.modify) {
            for (let modifyFid in conf.modify) {
                for (let modifyProp in conf.modify[modifyFid])
                    this.fields[modifyFid][modifyProp]=conf.modify[modifyFid][modifyProp];
            }
        }

        this.single=conf.single;

        this.recordRepresentation=conf.recordRepresentation;
        if (!this.recordRepresentation)
            this.recordRepresentation=this.server.collections[conf.from].recordRepresentation;
    }

    getTableName() {
        return this.from;
    }

    isView() {
        return true;
    }

    async getWhere(req) {
        let userId=await this.server.getUserIdByRequest(req);
        let replacements={
            "${userId}": userId,
            "$userId": userId
        }

        let retWhere={};
        for (let whereK in this.where) {
            let v=this.where[whereK];
            for (let replacementK in replacements)
                v=v.replaceAll(replacementK,replacements[replacementK]);

            retWhere[whereK]=v;
        }

        return retWhere;
    }

    async handleRequest(req, argv) {
        if (this.getType()!="singleView")
            return await super.handleRequest(req,argv);

        let role=await this.server.getRoleByRequest(req);
        if (!this.readAccess.includes(role))
            return new Response("Not authorized",{status: 403});

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

        if (!this.access.includes(role))
            return new Response("Not authorized",{status: 403});

        // Update.
        if (req.method=="PUT" && jsonEq(argv,["single"])) {
            let data=await this.server.getRequestFormData(req);
            delete data.id;
            //console.log(await this.getWhere(req));
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

    filterItem=(item)=>{
        for (let k in item) {
            if (k!="id" && !this.fields[k])
                delete item[k];
        }
        return item;
    }
}
