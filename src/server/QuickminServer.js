import {trimChar} from "../utils/js-util.js";
//import SequelizeDb from "../db/SequelizeDb.js";
import DrizzleDb from "../db/DrizzleDb.js";
import {netTry, splitPath} from "../utils/js-util.js";
import {jwtSign, jwtVerify} from "../utils/jwt-util.js";
import DbMigrator from "../migrate/DbMigrator.js";
import fs from "fs";
import NodeStorage from "../storage/NodeStorage.js";

function canonicalizeConf(conf) {
    let FIELD_TYPES=[
        "text",
        "richtext",
        "date",
        "datetime",
        "select",
        "image"
    ];

    if (conf.jwtSecret && conf.adminUser && conf.adminPass)
        conf.requireAuth=true;

    else if (conf.jwtSecret || conf.adminUser || conf.adminPass)
        throw new Error("Need none or all of adminUser, adminPass and jwtSecret");

    for (let c in conf.collections) {
        if (!conf.collections[c].title)
            conf.collections[c].title=c.charAt(0).toUpperCase()+c.slice(1);

        if (!conf.collections[c].listFields)
            conf.collections[c].listFields=Object.keys(conf.collections[c].fields);

        for (let f in conf.collections[c].fields) {
            if (typeof conf.collections[c].fields[f]=="string") {
                conf.collections[c].fields[f]={
                    type: conf.collections[c].fields[f]
                }
            }

            if (!FIELD_TYPES.includes(conf.collections[c].fields[f].type))
                throw new Error("Unknown field type: "+conf.collections[c].fields[f].type);
        }
    }

    return conf;
}

export default class QuickminServer {
    constructor(conf={}) {
        conf=canonicalizeConf(conf);
        Object.assign(this,conf);

        if (!this.storageClass)
            this.storageClass=NodeStorage;

        this.storage=new this.storageClass(conf);

        if (conf.sequelize) {
            this.db=new SequelizeDb({
                sequelize: this.sequelize,
                collections: this.collections
            });
        }

        else if (conf.drizzle) {
            this.db=new DrizzleDb({
                drizzle: this.drizzle,
                collections: this.collections
            });
        }

        else {
            //console.log("Warning: no database at startup.");
            throw new Error("No database");
        }
    }

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

        if (this.apiPath) {
            if (req.argv[0]!=this.apiPath)
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
                storagePath: this.storagePath
            });
        }

        else if (this.isPathRequest(req,"POST","_login")) {
            let body=await req.json();
            //console.log("it is a post..");
            //console.log(req.body);

            if (body.username==this.adminUser &&
                    body.password==this.adminPass) {
                let payload={
                    username: body.username
                };

                let token=jwtSign(payload,this.jwtSecret);
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

        console.log("processing form data");

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

        let payload=jwtVerify(authorization[1],this.jwtSecret);
        if (payload.username!=this.adminUser)
            throw new Error("Not logged in");
    }

    async sync() {
        let SYNC_FIELD_TYPES={
            "text": "text",
            "richtext": "text",
            "date": "text",
            "datetime": "text",
            "select": "text",
            "image": "text"
        };

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
                    type: SYNC_FIELD_TYPES[this.collections[c].fields[f].type],
                }
            }
        }

        let migrator=new DbMigrator({
            getSql: this.db.getSql,
            runSql: this.db.runSql,
            tables: tables,
        });

        await migrator.sync();
    }
}