import {parse as parseXml} from "txml/txml";
import {jsonClone, jsonEq, arrayDifference, arrayIntersection, arrayify} from "../utils/js-util.js";
import {getFieldContentFiles} from "./collection-util.js";

let QQL_TYPES={
    "text": "text",
    "richtext": "text",
    "date": "date",
    "datetime": "datetime",
    "select": "text",
    "image": "text",
    "authmethod": "text",
    "integer": "integer",
    "real": "real",
    "reference": "reference",
    "json": "json",
    "boolean": "boolean",
    "referencemany": null
};

export default class Collection {
	constructor(id, conf, server) {
		this.id=id;
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
        this.category=conf.category;
        this.icon=conf.icon;

        if (!this.actions)
            this.actions=[];

        if (conf.from || conf.singleFrom)
            this.constructView(conf);

        else
            this.constructTable(conf)
	}

    constructTable(conf) {
        this.type="table";
        this.fields={};
        this.listFields=[];

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
            if (!QQL_TYPES.hasOwnProperty(type))
                throw new Error("Unknown field type: "+type);

            let el={
                type: type,
                qqlType: QQL_TYPES[type],
                ...fieldEl.attributes
            }

            if (el.default && 
                    ["integer","real","boolean","json"].includes(el.type.toLowerCase()))
                el.default=JSON.parse(el.default);

            /*if (fieldEl.children.length)
                el.children=fieldEl.children;*/

            this.fields[fieldEl.attributes.id]=el;
        }

        if (!this.listFields.length)
            this.listFields=Object.keys(this.fields);
    }

    constructView(conf) {
        if (conf.from) {
            this.type="view";
            this.viewFrom=conf.from;
        }

        else if (conf.singleFrom) {
            this.type="singleView";
            this.viewFrom=conf.singleFrom;
        }

        this.where=conf.where;
        if (!this.where)
            this.where={};

        let include=conf.include;
        if (!include)
            include=Object.keys(this.getCollection().fields);

        include=arrayDifference(include,conf.exclude||[]);
        include=arrayDifference(include,Object.keys(this.where));
        this.include=include;

        this.fields={};
        for (let fieldId of this.include)
            this.fields[fieldId]=jsonClone(this.getCollection().fields[fieldId]);

        this.listFields=arrayIntersection(this.include,this.getCollection().listFields);
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
            category: this.category,
            icon: this.icon
		}
	}

    isView() {
        return (this.type!="table");
    }

    isStorageUsed() {
        if (this.isView())
            return false;

        let storageUsed=false;
        for (let fid in this.fields) {
            let field=this.fields[fid];
            if (["image","richtext"].includes(field.type))
                storageUsed||=true;
        }

        return storageUsed;
    }

    getQqlDef() {
        let def;

        if (this.isView()) {
            let include=[];
            for (let fieldId of this.include) {
                let field=this.getCollection().fields[fieldId];
                if (field.type!="referencemany")
                    include.push(fieldId);
            }

            def={
                include: include,
                where: this.where
            };

            if (this.type=="singleView")
                def.singleViewFrom=this.viewFrom;

            else
                def.viewFrom=this.viewFrom;
        }

        else {
            let fieldDefs={};
            //fieldDefs.id={type: "integer", pk: true, notnull: true};

            for (let fieldId in this.fields) {
                let field=this.fields[fieldId];
                if (field.type!="referencemany")
                    fieldDefs[fieldId]={
                        type: field.qqlType,
                        default: field.default,
                        reference: field.reference,
                        notnull: field.notnull
                    }
            }

            if (!fieldDefs.id)
                fieldDefs.id={type: "integer", notnull: true};

            if (fieldDefs.id.type!="integer")
                throw new Error("Id must be integer");

            if (!fieldDefs.id.notnull)
                throw new Error("Id must be notnull");

            fieldDefs.id.pk=true;

            def={
                fields: fieldDefs
            };
        }

        def.recordRepresentation=this.recordRepresentation;
        def.access=this.access;
        def.readAccess=this.readAccess;

        return def;
    }

    getCollection() {
        if (!this.isView())
            return this;

        return this.server.collections[this.viewFrom];
    }

    async getContentFiles() {
        if (this.isView())
            return [];

        let datas=await this.server.qql.query({manyFrom: this.id});
        let contentFiles=[];

        for (let data of datas) {
            for (let fid in this.fields) {
                let field=this.fields[fid];
                contentFiles=[...contentFiles, ...getFieldContentFiles(field,data)]
            }
        }

        return contentFiles;
    }
}
