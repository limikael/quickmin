import {jsonClone, jsonEq, arrayDifference, arrayIntersection, arrayify, arrayUnique} from "../utils/js-util.js";
import {getFieldContentFiles} from "./collection-util.js";

let QQL_TYPES={
    "text": "text",
    "richtext": "text",
    "date": "date",
    "datetime": "datetime",
    "select": "text",
    "image": "text",
    "file": "text",
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

        this.helperText=conf.helperText;
        this.recordRepresentation=conf.recordRepresentation;
        this.actions=conf.actions;
        this.category=conf.category;
        this.icon=conf.icon;
        this.hideFor=conf.hideFor;
        this.showFor=conf.showFor;

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

        for (let fieldId in conf.fields) {
            let fieldConf={...conf.fields[fieldId]};
            if (fieldConf.listable)
                this.listFields.push(fieldId);

            if (!QQL_TYPES.hasOwnProperty(fieldConf.type))
                throw new Error("Unknown field type: "+type);

            fieldConf.qqlType=QQL_TYPES[fieldConf.type];

            if (fieldConf.default && 
                    ["integer","real","boolean","json"].includes(fieldConf.type.toLowerCase()))
                fieldConf.default=JSON.parse(fieldConf.default);

            this.fields[fieldId]=fieldConf;
        }

        if (!this.listFields.length)
            this.listFields=Object.keys(this.fields);

        this.listFields=this.listFields.filter(fieldName=>{
            let cantList=["referencemany"];
            if (cantList.includes(this.fields[fieldName].type.toLowerCase()))
                return false;

            return true;
        });

        this.policies=conf.policies;
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

    getAccess() {
        let policies=this.getCollection().policies;
        let roles=[];
        for (let policy of policies)
            if (policy.operations.includes("create") ||
                    policy.operations.includes("update") ||
                    policy.operations.includes("delete"))
                roles.push(...policy.roles);

        return arrayUnique(roles);
    }

    getReadAccess() {
        let policies=this.getCollection().policies;
        let roles=[];
        for (let policy of policies)
            if (policy.operations.includes("read"))
                roles.push(...policy.roles);

        return arrayUnique(roles);
    }

	getSchema() {
		return {
			id: this.id,
            type: this.type,
        	fields: this.fields,
        	listFields: this.listFields,
            access: this.getAccess(),
            readAccess: this.getReadAccess(),
            helperText: this.helperText,
            recordRepresentation: this.recordRepresentation,
            actions: this.actions,
            category: this.category,
            icon: this.icon,
            showFor: this.showFor,
            hideFor: this.hideFor
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
            if (["image","richtext","file"].includes(field.type)) {
                if (field.fileUpload!==false && field.fileUpload!="false")
                    storageUsed||=true;
            }
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
                        notnull: field.notnull,
                        prop: field.prop,
                        refprop: field.refprop
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

            /*def.access=this.access;
            def.readAccess=this.readAccess;*/
            def.policies=this.policies;
        }

        //def.recordRepresentation=this.recordRepresentation;

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
