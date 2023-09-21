import {splitPath, jsonEq, getFileExt} from "../utils/js-util.js";
import {jwtSign, jwtVerify} from "../utils/jwt-util.js";
import DbMigrator from "../migrate/DbMigrator.js";
import {parse as parseYaml} from "yaml";
import {getElementsByTagName, getElementByTagName} from "../utils/xml-util.js";
import {TableCollection, ViewCollection} from "./Collection.js";
import urlJoin from "url-join";
import {handleRequest as handleIsoqRequest} from "../loader/isoq-raw.js";
import {minimatch} from 'minimatch';
import QuickminServerApi from "./QuickminServerApi.js";

export default class QuickminServer {
    constructor(confYaml, drivers=[]) {
        if (typeof confYaml=="string")
            confYaml=parseYaml(confYaml);

        this.conf=confYaml;
        this.authMethods={};

        this.roles=this.conf.roles;
        if (!this.roles)
            this.roles=[];

        this.hostConf=this.conf.hostConf;
        if (!this.hostConf)
            this.hostConf=[];

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

        this.api=new QuickminServerApi(this);
    }

    getHostConf(hostname) {
        for (let hostConf of this.hostConf) {
            if (minimatch(hostname,hostConf.host))
                return {...this.conf,...hostConf};
        }

        return this.conf;
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

        if (argv.length==0 || jsonEq(argv,["quickmin-client.js"])) {
            let u=new URL(req.url)
            return await handleIsoqRequest(req,{
                clientPathname: urlJoin("/",this.conf.apiPath,"quickmin-client.js"),
                props: {
                    quickminBundleUrl: "/quickmin-bundle.js",
                    api: urlJoin(u.origin,this.conf.apiPath)
                }
            });
        }

        else if (argv[0]=="_content") {
            let path=new URL(req.url).pathname;
            return await this.storage.getResponse(argv[1],req);
        }

        else if (req.method=="GET" && jsonEq(argv,["_oauthRedirect"])) {
            let reqUrl=new URL(req.url);
            let {provider,referer}=JSON.parse(reqUrl.searchParams.get("state"));

            let refererUrl=new URL(referer);
            refererUrl.search=reqUrl.searchParams;

            let headers=new Headers();
            headers.set("location",refererUrl);
            return new Response("Moved",{
                status: 302,
                headers: headers
            });
        }

        else if (req.method=="POST" && jsonEq(argv,["_authUrls"])) {
            let body=await req.json();
            if (!body.referer)
                throw new Error("Expected referer");

            let reqUrl=new URL(req.url);
            let hostConf=this.getHostConf(reqUrl.hostname);
            if (hostConf.oauthHostname)
                reqUrl.hostname=hostConf.oauthHostname;

            let reurl=urlJoin(reqUrl.origin,this.conf.apiPath,"_oauthRedirect");

            let authButtons={};
            for (let method in this.authMethods) {
                let state=JSON.stringify({
                    ...body,
                    provider: method
                });
                authButtons[method]=await this.authMethods[method].getLoginUrl(reurl,state);
            }

            return Response.json(authButtons);
        }

        else if (req.method=="GET" && jsonEq(argv,["_schema"])) {
            let reqUrl=new URL(req.url);
            let hostConf=this.getHostConf(reqUrl.hostname);
            if (hostConf.oauthHostname)
                reqUrl.hostname=hostConf.oauthHostname;

            let reurl=urlJoin(reqUrl.origin,this.conf.apiPath,"_oauthRedirect");

            let authButtons={};
            for (let method in this.authMethods) {
                let state=JSON.stringify({
                    referer: req.headers.get("referer"),
                    provider: method
                });
                authButtons[method]=await this.authMethods[method].getLoginUrl(reurl,state);
            }

            let collectionsSchema={};
            for (let cid in this.collections)
                collectionsSchema[cid]=this.collections[cid].getSchema();

            return Response.json({
                collections: collectionsSchema,
                requireAuth: this.requireAuth,
                authButtons: authButtons,
            });
        }

        else if (req.method=="POST" && jsonEq(argv,["_oauthLogin"])) {
            let reqUrl=new URL(req.url);
            let body=await req.json();
            let {provider}=JSON.parse(body.state);

            let hostConf=this.getHostConf(reqUrl.hostname);
            if (hostConf.oauthHostname)
                reqUrl.hostname=hostConf.oauthHostname;

            let reurl=urlJoin(reqUrl.origin,this.conf.apiPath,"_oauthRedirect");
            let loginToken=await this.authMethods[provider].process(body.url,reurl);

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

        else if (req.method=="POST" && jsonEq(argv,["_upload"])) {
            if (!await this.getUserIdByRequest(req))
                return new Response("Forbidden",{
                    status: 403
                });

            let data=await this.getRequestFormData(req);
            return Response.json({
                file: data.file
            });
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
        let exts=[".jpg",".jpeg",".png"];
        let contentType=req.headers.get("content-type").split(";")[0];

        switch (contentType) {
            case "multipart/form-data":
                let formData=await req.formData();
                let record={};
                for (let [name,data] of formData.entries()) {
                    if (data instanceof File) {
                        //console.log("putting: "+data.name+" size: "+data.size);

                        let ext=getFileExt(data.name).toLowerCase();
                        if (!exts.includes(ext))
                            throw new Error("Unknown file type: "+ext);

                        let fn=crypto.randomUUID()+ext;
                        await this.storage.putFile(fn,data);
                        record[name]=fn;
                    }

                    else {
                        record[name]=JSON.parse(data);
                    }
                }

                return record;
                break;

            case "application/json":
                return await req.json();
                break;
        }

        throw new Error("Unexpected content type: "+contentType);
    }

    async sync({dryRun, force}) {
        let tables={};
        for (let c in this.collections) {
            if (!this.collections[c].isView()) {
                tables[c]={
                    fields: {
                        id: {
                            type: "integer",
                            pk: true
                        }
                    },
                };
                for (let f in this.collections[c].fields) {
                    let field=this.collections[c].fields[f];
                    let fieldSpec={
                        ...field,
                        pk: false,
                        type: field.sqlType,
                    };

                    if (field.type=="reference") {
                        fieldSpec.reference_table=fieldSpec.reference;
                        fieldSpec.reference_field="id";
                    }

                    tables[c].fields[f]=fieldSpec;
                }
            }
        }

        //console.log(JSON.stringify(tables,null,2));

        let migrator=new DbMigrator({
            getSql: this.db.getSql,
            runSql: this.db.runSql,
            tables: tables,
            dryRun: dryRun,
            force: force
        });

        await migrator.sync();
    }
}