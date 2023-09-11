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
            for (let fid in this.collections[cid].fields) {
                let field=this.collections[cid].fields[fid];

                if (field.type=="authmethod" &&
                        this.authMethods[field.provider]) {
                    this.authMethods[field.provider].collectionId=cid;
                    this.authMethods[field.provider].fieldId=fid;
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
            let u=new URL(req.headers.get("referer"))
            let reurl=u.origin+u.pathname;
            let loginToken=await this.authMethods[provider].process(reurl, body.url);

            let q={};
            q[this.authMethods[provider].fieldId]=loginToken;

            let collectionId=this.authMethods[provider].collectionId;
            let userRecord=await this.db.findOne(collectionId,q);
            if (!userRecord)
                return new Response("Not authorized...",{
                    status: 403
                });

            let usernameField=this.getTaggedCollectionField(collectionId,"username",true);

            let payload={
                provider: provider,
                id: userRecord.id,
            };

            let token=jwtSign(payload,this.conf.jwtSecret);
            return Response.json({
                username: userRecord[usernameField],
                roleLevel: await this.getRoleLevelByPayload(payload),
                token: token
            });
        }

        else if (req.method=="POST" && jsonEq(argv,["_login"])) {
            let body=await req.json();
            if (body.username==this.conf.adminUser &&
                    body.password==this.conf.adminPass) {
                let payload={
                    provider: "admin",
                };

                let token=jwtSign(payload,this.conf.jwtSecret);
                return Response.json({
                    username: this.conf.adminUser,
                    roleLevel: await this.getRoleLevelByPayload(payload),
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

    async getRoleLevelByPayload(userPayload) {
        let level;

        switch (userPayload.provider) {
            case "admin":
                level=this.roles.length-1;
                break;

            case "google":
                let collectionId=this.authMethods.google.collectionId;
                let userRecord=await this.db.findOne(collectionId,{id: userPayload.id});
                let roleField=this.getTaggedCollectionField(collectionId,"role",true);
                level=this.roles.indexOf(userRecord[roleField]);
                break;

            default:
                throw new Error("Unknown auth provider");
                break;
        }

        if (level<0)
            level=0;

        return level;
    }

    async getRoleLevelByRequest(req) {
        if (!req.headers.get("authorization"))
            return -1;

        let authorization=req.headers.get("authorization").split(" ");
        if (authorization[0]!="Bearer")
            throw new Error("Expected bearer authorization");

       let payload=jwtVerify(authorization[1],this.conf.jwtSecret);
       return await this.getRoleLevelByPayload(payload);
    }

    async assertRequestRoleLevel(req, requiredLevel) {
        let requestLevel=await this.getRoleLevelByRequest(req);
        if (requestLevel<requiredLevel)
            throw new Error("Not authorized");
    }

    async getRequestFormData(req) {
        let formData=await req.formData();
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