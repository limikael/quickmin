import {netTry, splitPath} from "../utils/js-util.js";
import {jwtSign, jwtVerify} from "../utils/jwt-util.js";
import DbMigrator from "../migrate/DbMigrator.js";
import {parse as parseXml} from "txml";
import {parse as parseYaml} from "yaml";
import {getElementsByTagName, getElementByTagName} from "../utils/xml-util.js";

export default class QuickminServer {
    constructor(confYaml, drivers=[]) {
        let SQL_TYPES={
            "text": "text",
            "richtext": "text",
            "date": "date",
            "datetime": "datetime",
            "select": "text",
            "image": "text"
        };

        if (typeof confYaml=="string")
            confYaml=parseYaml(confYaml);

        this.conf=confYaml;

        this.collections={};
        for (let collectionId in this.conf.collections) {
            let collectionConf=this.conf.collections[collectionId];

            let collection={
                id: collectionId,
                fields: {},
                listFields: []
            }

            let fieldEls=parseXml(collectionConf.fields);
            for (let fieldEl of fieldEls) {
                for (let k in fieldEl.attributes)
                    if (fieldEl.attributes[k]===null)
                        fieldEl.attributes[k]=true;

                if (fieldEl.attributes.listable)
                    collection.listFields.push(fieldEl.attributes.id);

                let type=fieldEl.tagName.toLowerCase();
                if (!SQL_TYPES[type])
                    throw new Error("Unknown field type: "+type);

                collection.fields[fieldEl.attributes.id]={
                    type: type,
                    sqlType: SQL_TYPES[type],
                    children: fieldEl.children,
                    ...fieldEl.attributes
                }
            }

            if (!collection.listFields.length)
                collection.listFields=Object.keys(collection.fields);

            this.collections[collectionId]=collection;
        }

        if (!this.conf.apiPath)
            this.conf.apiPath="";

        if (this.conf.jwtSecret || this.conf.adminUser || this.conf.adminPass) {
            if (!this.conf.jwtSecret || !this.conf.adminUser || !this.conf.adminPass)
                throw new Error("Need secret, user, pass for Authorization");

            this.requireAuth=true;
        }

        for (let driver of drivers)
            driver(this);
    }

    /*getConf(name) {
        let el=getElementByTagName(this.conf,name);
        if (!el)
            return {};

        return el.attributes;
    }*/

    isPathRequest(req, method, path) {
        return (req.method==method
            && req.argv.length==1
            && req.argv[0]==path)
    }

    isModelRequest(req, method, argc) {
        return (req.method==method
            && req.argv.length==argc
            && this.db.isModel(req.argv[0]))
    }

    handleRequest=async (req)=>{
        //req=req.clone();
        req.argv=splitPath(new URL(req.url).pathname);

        if (this.conf.apiPath) {
            if (req.argv[0]!=this.conf.apiPath)
                return;

            req.argv.shift();
        }

        if (req.argv[0]=="_content") {
            let path=new URL(req.url).pathname;
            return await this.storage.getResponse(req.argv[1],req);
        }

        else if (this.isPathRequest(req,"GET","_schema")) {
            return Response.json({
                collections: this.collections,
                requireAuth: this.requireAuth,
            });
        }

        else if (this.isPathRequest(req,"POST","_login")) {
            let body=await req.json();
            //console.log("it is a post..");
            //console.log(req.body);

            if (body.username==this.conf.adminUser &&
                    body.password==this.conf.adminPass) {
                let payload={
                    username: body.username
                };

                let token=jwtSign(payload,this.conf.jwtSecret);
                return Response.json({
                    token: token
                });
            }

            else {
                return new Response("Bad credentials",{status: 403});
            }
        }

        else if (this.isModelRequest(req,"GET",1)) {
            return Response.json(await this.db.findMany(
                req.argv[0]
            ),{headers:{"Content-Range": "0-2/2"}});
        }

        else if (this.isModelRequest(req,"GET",2)) {
            let item=await this.db.findOne(
                req.argv[0],
                req.argv[1]
            );

            if (!item)
                return new Response("Not found",{status: 404});

            return Response.json(item);
        }

        else if (this.isModelRequest(req,"POST",1)) {
            this.authorizeWrite(req);
            return Response.json(await this.db.insert(
                req.argv[0],
                await this.getRequestFormData(req)
            ));
        }

        else if (this.isModelRequest(req,"PUT",2)) {
            this.authorizeWrite(req);
            return Response.json(await this.db.update(
                req.argv[0],
                req.argv[1],
                await this.getRequestFormData(req)
            ));
        }

        else if (this.isModelRequest(req,"DELETE",2)) {
            this.authorizeWrite(req);
            return Response.json(await this.db.delete(
                req.argv[0],
                req.argv[1],
            ));
        }
    }

    async getRequestFormData(req) {
        let formData=await req.formData();

        //console.log("processing form data");

        let record={};
        for (let [name,data] of formData.entries()) {
            if (data instanceof File) {
                console.log("processing file: "+data.name);
                await this.storage.putFile(data);
                record[name]=data.name;
            }

            else {
                record[name]=JSON.parse(data);
            }
        }

        return record;
    }

    authorizeWrite(req) {
        if (!this.requireAuth)
            return;

        if (!req.headers.get("authorization"))
            throw new Error("Expected bearer authorization");

        let authorization=req.headers.get("authorization").split(" ");
        if (authorization[0]!="Bearer")
            throw new Error("Expected bearer authorization");

        let payload=jwtVerify(authorization[1],this.conf.jwtSecret);
        if (payload.username!=this.conf.adminUser)
            throw new Error("Not logged in");
    }

    async sync(dryRun) {
        let tables={};
        for (let c in this.collections) {
            tables[c]={
                id: {
                    type: "integer",
                    pk: true
                }
            };
            for (let f in this.collections[c].fields) {
                tables[c][f]={
                    ...this.collections[c].fields[f],
                    pk: false,
                    type: this.collections[c].fields[f].sqlType,
                }
            }
        }

        let migrator=new DbMigrator({
            getSql: this.db.getSql,
            runSql: this.db.runSql,
            tables: tables,
            dryRun: dryRun
        });

        await migrator.sync();
    }
}