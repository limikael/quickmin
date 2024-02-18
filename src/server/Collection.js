import {parse as parseXml} from "txml/txml";
import {jsonClone, jsonEq} from "../utils/js-util.js";

let SQL_TYPES={
    "text": "text",
    "richtext": "text",
    "date": "date",
    "datetime": "datetime",
    "select": "text",
    "image": "text",
    "authmethod": "text",
    "integer": "integer",
    "real": "real",
    "reference": "integer",
    "json": "text",
    "boolean": "boolean",
    "referencemany": null
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
        this.hidden=conf.hidden;
        this.category=conf.category;
        this.icon=conf.icon;

        if (!this.actions)
            this.actions=[];
	}

	getSchema() {
		return {
			id: this.id,
            type: this.type,
        	fields: this.fields,
        	listFields: this.listFields,
            access: this.access,
            readAccess: this.readAccess,
            helperText: this.helperText,
            recordRepresentation: this.recordRepresentation,
            actions: this.actions,
            hidden: this.hidden,
            category: this.category,
            icon: this.icon
		}
	}

    representItem=(item)=>{
        if (!item)
            return item;

        let fields=this.fields;
        if (this.from)
            fields=this.server.collections[this.from].fields;

        for (let fid in fields) {
            if (item.hasOwnProperty(fid)) {
                switch (fields[fid].type) {
                    case "json":
                        item[fid]=JSON.stringify(item[fid]);
                        break;

                    case "boolean":
                        item[fid]=Number(item[fid]);
                        break;
                }
            }
        }

        return item;
    }

    presentItem=(item)=>{
        if (!item)
            return item;

        for (let fid in this.fields) {
            let field=this.fields[fid];
            if (item.hasOwnProperty(fid)) {
                switch (field.type) {
                    case "json":
                        if (item[fid])
                            item[fid]=JSON.parse(item[fid]);

                        else
                            item[fid]=null;
                        break;

                    case "boolean":
                        item[fid]=Boolean(item[fid]);
                        break;
                }
            }
        }

        return item;
    }

    filterItem=(item)=>{
        return item;
    }

	async handleRequest(req, argv) {
        let role;
        if (!this.readAccess.includes("public")) {
            role=role||await this.server.getRoleByRequest(req);
            if (!this.readAccess.includes(role))
                return new Response("Not authorized",{status: 403});
        }

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

            let sort;
            if (u.searchParams.get("sort"))
                sort=JSON.parse(u.searchParams.get("sort"));

            //console.log("sort: "+sort);

            let options={range: range, sort: sort};
			let data=await this.server.db.findMany(
                this.getTableName(),
                {...filter, ...await this.getWhere(req)},
                options
            );

            //console.log("count: "+options.count);

            data=data.map(this.filterItem);
            data=data.map(this.presentItem);

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

            return Response.json(this.presentItem(this.filterItem(item)));
        }

        role=role||await this.server.getRoleByRequest(req);
        if (!this.access.includes(role))
            return new Response("Not authorized",{status: 403});

        // Create.
        if (req.method=="POST" && argv.length==0) {
            let data=await this.server.getRequestFormData(req);
            let result=await this.server.db.insert(
                this.getTableName(),
                this.representItem({...data, ...await this.getWhere(req)})
            );

            return Response.json(this.presentItem(result));
        }

        // Update.
        if (req.method=="PUT" && argv.length==1) {
            let data=await this.server.getRequestFormData(req);
            //console.log("updating ",data);

            let result=await this.server.db.update(
                this.getTableName(),
                {id: argv[0], ...await this.getWhere(req)},
                this.representItem({...data, ...await this.getWhere(req)})
            );

            return Response.json(this.presentItem(result));
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

            return Response.json(this.presentItem(item));
        }
	}
}

export class TableCollection extends Collection {
    constructor(id, conf, server) {
        super(id, conf, server);

        this.type="table";
        let fieldEls=parseXml(conf.fields);
        for (let fieldEl of fieldEls) {
            if (!fieldEl.attributes.id)
                throw new Error("Id missing from field: "+ìd+": "+JSON.stringify(fieldEl.attributes));

            for (let k in fieldEl.attributes)
                if (fieldEl.attributes[k]===null)
                    fieldEl.attributes[k]=true;

            if (fieldEl.attributes.listable)
                this.listFields.push(fieldEl.attributes.id);

            let type=fieldEl.tagName.toLowerCase();
            if (!SQL_TYPES.hasOwnProperty(type))
                throw new Error("Unknown field type: "+type);

            let el={
                type: type,
                sqlType: SQL_TYPES[type],
                ...fieldEl.attributes
            }

            if (el.default && 
                    ["integer","real","boolean","json"].includes(el.type.toLowerCase()))
                el.default=JSON.parse(el.default);

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

    getContentFilesFromTags(tags) {
        let contentFiles=[];

        for (let tag of tags) {
            if (tag.children) {
                contentFiles=[
                    ...contentFiles,
                    ...this.getContentFilesFromTags(tag.children)
                ];
            }

            if (tag.tagName=="img" && tag.attributes.src) {
                let fn=tag.attributes.src.split("/").pop();
                contentFiles.push(fn);
            }
        }

        return contentFiles;
    }

    getFieldContentFiles(field, data) {
        switch (field.type) {
            case "image":
                let v=data[field.id];
                if (v)
                    return [v];

                return [];
                break;

            case "richtext":
                if (!data[field.id])
                    return [];

                return this.getContentFilesFromTags(parseXml(data[field.id]));
                break;

            default:
                return [];
                break;
        }
    }

    async getContentFiles() {
        let datas=await this.server.db.findMany(this.getTableName());
        let contentFiles=[];

        for (let data of datas) {
            for (let fid in this.fields) {
                let field=this.fields[fid];
                contentFiles=[...contentFiles, ...this.getFieldContentFiles(field,data)]
            }
        }

        return contentFiles;
    }

    isStorageUsed() {
        let storageUsed=false;
        for (let fid in this.fields) {
            let field=this.fields[fid];
            if (["image","richtext"].includes(field.type))
                storageUsed||=true;
        }

        return storageUsed;
    }
}

export class ViewCollection extends Collection {
    constructor(id, conf, server) {
        super(id, conf, server);

        if (conf.from) {
            this.type="view";
            this.from=conf.from;
        }

        else if (conf.singleFrom) {
            this.type="singleView";
            this.from=conf.singleFrom;
        }

        else
            throw new Error("Not a view of single view...");

        if (this.server.collections[this.from].isView())
            throw new Error("Can't create a view from a view");

        this.where=conf.where;
        this.fields=jsonClone(this.server.collections[this.from].fields);
        this.listFields=jsonClone(this.server.collections[this.from].listFields);

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

        this.recordRepresentation=conf.recordRepresentation;
        if (!this.recordRepresentation)
            this.recordRepresentation=this.server.collections[this.from].recordRepresentation;

        this.icon=conf.icon;
        if (!this.icon)
            this.icon=this.server.collections[this.from].icon;
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
            if (typeof v=="string") {
                for (let replacementK in replacements)
                    v=v.replaceAll(replacementK,replacements[replacementK]);
            }

            retWhere[whereK]=v;
        }

        return retWhere;
    }

    async handleRequest(req, argv) {
        if (this.type!="singleView")
            return await super.handleRequest(req,argv);

        let role;
        if (!this.readAccess.includes("public")) {
            role=role||await this.server.getRoleByRequest(req);
            if (!this.readAccess.includes(role))
                return new Response("Not authorized",{status: 403});
        }

        // Find.
        if (req.method=="GET" && jsonEq(argv,["single"])) {
            let item=await this.server.db.findOne(
                this.getTableName(),
                await this.getWhere(req)
            );

            if (!item)
                return Response.json({id: "single"});

            return Response.json(this.presentItem({...item, id: "single"}));
        }

        role=role||await this.server.getRoleByRequest(req);
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
                this.representItem({...data, ...await this.getWhere(req)})
            );

            if (!queryResult) {
                queryResult=await this.server.db.insert(
                    this.getTableName(),
                    this.representItem({...data, ...await this.getWhere(req)})
                );
            }

            return Response.json(this.presentItem({...queryResult, id: "single"}));
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
