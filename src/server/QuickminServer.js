import {netTry, splitPath, jsonEq} from "../utils/js-util.js";
import {jwtSign, jwtVerify} from "../utils/jwt-util.js";
import DbMigrator from "../migrate/DbMigrator.js";
import {parse as parseYaml} from "yaml";
import {getElementsByTagName, getElementByTagName} from "../utils/xml-util.js";
import {TableCollection, ViewCollection} from "./Collection.js";

export default class QuickminServer {
    constructor(confYaml, drivers=[]) {
        if (typeof confYaml=="string")
            confYaml=parseYaml(confYaml);

        this.conf=confYaml;
        this.authMethods={};

        this.roles=this.conf.roles;
        if (!this.roles)
            this.roles=[];

        this.collections={};
        for (let collectionId in this.conf.collections) {
            this.collections[collectionId]=new TableCollection(
                collectionId,
                this.conf.collections[collectionId],
                this
            );
        }

        for (let viewId in this.conf.views) {
            this.collections[viewId]=new ViewCollection(
                viewId,
                this.conf.views[viewId],
                this
            );
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

        for (let cid in this.collections) {
            if (!this.collections[cid].isView()) {
                for (let fid in this.collections[cid].fields) {
                    let field=this.collections[cid].fields[fid];

                    if (field.type=="authmethod" &&
                            this.authMethods[field.provider]) {
                        if (this.authCollection && this.authCollection!=cid)
                            throw new Error("Only one collection can be user for auth.");

                        this.authCollection=cid;
                        this.authMethods[field.provider].fieldId=fid;
                    }
                }
            }
        }
    }

    getTaggedCollectionField(collectionId, tag, value) {
        for (let fieldId in this.collections[collectionId].fields)
            if (this.collections[collectionId].fields[fieldId][tag]==value)
                return fieldId;
    }

    handleRequest=async (req)=>{
        let argv=splitPath(new URL(req.url).pathname);
        if (this.conf.apiPath) {
            if (argv[0]!=this.conf.apiPath)
                return;

            argv.shift();
        }

        if (argv[0]=="_content") {
            let path=new URL(req.url).pathname;
            return await this.storage.getResponse(argv[1],req);
        }

        else if (req.method=="GET" && jsonEq(argv,["_schema"])) {
            let u=new URL(req.headers.get("referer"))
            let reurl=u.origin+u.pathname;

            let authButtons={};
            for (let method in this.authMethods)
                authButtons[method]=await this.authMethods[method].getLoginUrl(reurl);

            let collectionsSchema={};
            for (let cid in this.collections)
                collectionsSchema[cid]=this.collections[cid].getSchema();

            return Response.json({
                collections: collectionsSchema,
                requireAuth: this.requireAuth,
                authButtons: authButtons
            });
        }

        else if (req.method=="POST" && jsonEq(argv,["_oauthLogin"])) {
            let body=await req.json();
            let provider=body.state;
            /*let u=new URL(req.headers.get("referer"))
            let reurl=u.origin+u.pathname;*/
            let loginToken=await this.authMethods[provider].process(body.url);

            let q={};
            q[this.authMethods[provider].fieldId]=loginToken;

            let userRecord=await this.db.findOne(this.authCollection,q);
            if (!userRecord)
                return new Response("Not authorized...",{
                    status: 403
                });

            let usernameField=this.getTaggedCollectionField(this.authCollection,"username",true);

            let payload={
                userId: userRecord.id
            };

            let token=jwtSign(payload,this.conf.jwtSecret);
            return Response.json({
                username: userRecord[usernameField],
                role: await this.getRoleByUserId(payload.userId),
                token: token
            });
        }

        else if (req.method=="POST" && jsonEq(argv,["_login"])) {
            let body=await req.json();
            if (body.username==this.conf.adminUser &&
                    body.password==this.conf.adminPass) {
                let payload={
                    userId: -1,
                };

                let token=jwtSign(payload,this.conf.jwtSecret);
                return Response.json({
                    username: this.conf.adminUser,
                    role: await this.getRoleByUserId(payload.userId),
                    token: token
                });
            }

            else {
                return new Response("Bad credentials",{status: 403});
            }
        }

        else if (this.collections[argv[0]]) {
            let collection=this.collections[argv[0]];
            return await collection.handleRequest(req, argv.slice(1));
        }
    }

    getUserIdByRequest(req) {
        if (!req.headers.get("authorization"))
            return;

        let authorization=req.headers.get("authorization").split(" ");
        if (authorization[0]!="Bearer")
            throw new Error("Expected bearer authorization");

       let payload=jwtVerify(authorization[1],this.conf.jwtSecret);
       return payload.userId;
    }

    async getRoleByUserId(userId) {
        if (userId==-1)
            return "admin";

        if (!userId)
            return "public";

        if (!this.authCollection)
            return -1;

        let userRecord=await this.db.findOne(this.authCollection,{id: userId});
        if (!userRecord)
            return -1;

        let roleField=this.getTaggedCollectionField(this.authCollection,"role",true);
        return userRecord[roleField];
    }

    async getRoleByRequest(req) {
        return this.getRoleByUserId(this.getUserIdByRequest(req));
    }

    async getRequestFormData(req) {
        let formData=await req.formData();
        let record={};
        for (let [name,data] of formData.entries()) {
            if (data instanceof File) {
                console.log("processing file: "+data.name);
                await this.storage.putFile(data);
                //console.log("done putting...");
                record[name]=data.name;
            }

            else {
                record[name]=JSON.parse(data);
            }
        }

        return record;
    }

    async sync(dryRun) {
        let tables={};
        for (let c in this.collections) {
            if (!this.collections[c].isView()) {
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