import {splitPath, jsonEq, getFileExt, parseCookie} from "../utils/js-util.js";
import {jwtSign, jwtVerify} from "../utils/jwt-util.js";
import DbMigrator from "../migrate/DbMigrator.js";
import {parse as parseYaml} from "yaml";
import {getElementsByTagName, getElementByTagName} from "../utils/xml-util.js";
import {TableCollection, ViewCollection} from "./Collection.js";
import urlJoin from "url-join";
import {minimatch} from 'minimatch';
import QuickminServerApi from "./QuickminServerApi.js";
import {googleAuthDriver} from "../auth/google-auth.js";
import {microsoftAuthDriver} from "../auth/microsoft-auth.js";
import {facebookAuthDriver} from "../auth/facebook-auth.js";
import {loaderTemplate} from "../ui/loader-template.js";

export default class QuickminServer {
    constructor(confYaml, drivers=[]) {
        if (typeof confYaml=="string")
            confYaml=parseYaml(confYaml);

        this.conf=confYaml;
        this.authMethods={};

        this.signupRole=this.conf.signupRole;

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

        drivers=[...drivers,
            googleAuthDriver,
            microsoftAuthDriver,
            facebookAuthDriver
        ];

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

    presentItem(collectionId, item) {
        let collection=this.collections[collectionId];
        if (!collection)
            throw new Error("No such collection: "+collectionId);

        return collection.presentItem(item);
    }

    representItem(collectionId, item) {
        let collection=this.collections[collectionId];
        if (!collection)
            throw new Error("No such collection: "+collectionId);

        return collection.representItem(item);
    }

    findReferencesForTable(tableName) {
        let res=[];

        for (let collectionId in this.collections) {
            let collection=this.collections[collectionId];
            for (let fieldId in collection.fields) {
                let field=collection.fields[fieldId];
                if (field.type=="reference"
                        && field.reference==tableName)
                    res.push({
                        collectionId: collectionId,
                        fieldId: fieldId
                    });
            }
        }

        return res;
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
        //await new Promise(resolve=>setTimeout(resolve,500));

        let argv=splitPath(new URL(req.url).pathname);

        if (this.conf.apiPath) {
            if (argv[0]!=this.conf.apiPath)
                return;

            argv.shift();
        }

        //await new Promise(r=>setTimeout(r,1000));

        if (argv.length==0 || jsonEq(argv,["quickmin-client.js"])) {
            let u=new URL(req.url)
            let index=loaderTemplate.replaceAll("$$LOADER_PROPS$$",JSON.stringify({
                quickminBundleUrl: "/quickmin-bundle.js",
                api: urlJoin(u.origin,this.conf.apiPath)
            }));
            return new Response(index,{
                headers: {
                    "content-type": "text/html;charset=UTF-8",
                }
            });

            /*let u=new URL(req.url)
            return await handleIsoqRequest(req,{
                clientPathname: urlJoin("/",this.conf.apiPath,"quickmin-client.js"),
                props: {
                    quickminBundleUrl: "/quickmin-bundle.js",
                    api: urlJoin(u.origin,this.conf.apiPath)
                }
            });*/
        }

        else if (argv[0]=="_content") {
            let path=new URL(req.url).pathname;
            return await this.storage.getResponse(argv[1],req);
        }

        else if (jsonEq(argv,["_getCurrentUser"])) {
            //console.log("headers in _getCurrentUser: ",req.headers);

            let userId=this.getUserIdByRequest(req);
            if (!userId)
                return Response.json(null);

            let userRecord=await this.db.findOne(this.authCollection,{id: userId});
            if (!userRecord)
                return Response.json(null);

            //console.log("id: ",userId," record: ",userRecord);

            return Response.json(userRecord);
        }

        else if (req.method=="GET" && jsonEq(argv,["_oauthRedirect"])) {
            let reqUrl=new URL(req.url);
            let {provider,referer}=JSON.parse(reqUrl.searchParams.get("state"));

            //let reurl=urlJoin(reqUrl.origin,this.conf.apiPath,"_oauthRedirect");
            let loginToken=await this.authMethods[provider].process(reqUrl);
            console.log("login token: "+loginToken+" for provider: "+provider);

            let q={};
            q[this.authMethods[provider].fieldId]=loginToken;

            let userRecord=await this.db.findOne(this.authCollection,q);
            if (!userRecord) {
                if (!this.signupRole) {
                    let headers=new Headers();
                    headers.set("location",referer);
                    return new Response("Moved",{
                        status: 302,
                        headers: headers
                    });
                }

                let roleField=this.getTaggedCollectionField(this.authCollection,"role",true);
                let q={};
                q[roleField]=this.signupRole;
                q[this.authMethods[provider].fieldId]=loginToken;

                userRecord=await this.db.insert(this.authCollection,q);
            }

            let usernameField=this.getTaggedCollectionField(this.authCollection,"username",true);
            let roleField=this.getTaggedCollectionField(this.authCollection,"role",true);

            let payload={
                userId: userRecord.id,
                role: userRecord[roleField],
                userName: userRecord[usernameField],
            };

            let token=jwtSign(payload,this.conf.jwtSecret);

            let headers=new Headers();
            headers.set("location",referer);
            headers.set("set-cookie","qmtoken="+token+"; path=/");
            /*headers.set("access-control-expose-headers","Set-Cookie");
            headers.set("Access-Control-Allow-Credentials",true);
            headers.set("Access-Control-Allow-Origin","http://localhost:3000");*/

            return new Response("Moved",{
                status: 302,
                headers: headers
            });
        }

        else if (req.method=="POST" && jsonEq(argv,["_authUrls"])) {
            let body=await req.json();
            if (!body.referer)
                throw new Error("Expected referer");

            let authUrls=await this.getAuthUrls(body.referer,body);
            return Response.json(authUrls);
        }

        else if (req.method=="GET" && jsonEq(argv,["_schema"])) {
            let reqUrl=new URL(req.url);
            let reUrl=urlJoin(reqUrl.origin,this.conf.apiPath);

            let collectionsSchema={};
            for (let cid in this.collections)
                collectionsSchema[cid]=this.collections[cid].getSchema();

            return Response.json({
                collections: collectionsSchema,
                requireAuth: this.requireAuth,
                authUrls: await this.getAuthUrls(reUrl),
            });
        }

        else if (req.method=="POST" && jsonEq(argv,["_login"])) {
            let body=await req.json();
            if (body.username==this.conf.adminUser &&
                    body.password==this.conf.adminPass) {
                let payload={
                    userId: -1,
                    userName: this.conf.adminUser,
                    role: await this.getRoleByUserId(-1)
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

        else if (req.method=="POST" && jsonEq(argv,["_gc"])) {
            let role=await this.getRoleByRequest(req);
            //console.log("role: "+role);
            if (role!="admin") {
                return new Response("Forbidden",{
                    status: 403
                });
            }

            let u=new URL(req.url);
            let dryRun=u.searchParams.get("dryRun");

            let result=await this.garbageCollect({dryRun});
            return Response.json(result);
        }

        else if (this.collections[argv[0]]) {
            let collection=this.collections[argv[0]];
            return await collection.handleRequest(req, argv.slice(1));
        }
    }

    async getAuthUrls(referer, state={}) {
        let u=new URL(referer);
        let hostConf=this.getHostConf(u.hostname);
        if (hostConf.oauthHostname)
            u.hostname=hostConf.oauthHostname;

        let reurl=urlJoin(u.origin,this.conf.apiPath,"_oauthRedirect");

        let authUrls={};
        for (let method in this.authMethods) {
            let wrappedState=JSON.stringify({
                referer: referer,
                provider: method,
                ...state
            });
            authUrls[method]=this.authMethods[method].getLoginUrl(reurl,wrappedState);
        }

        return authUrls;
    }

    getUserIdByRequest(req) {
        if (req.headers.get("x-api-key")
                && this.conf.apiKey
                && req.headers.get("x-api-key")==this.conf.apiKey) {
            return -1;
        }

        if (req.headers.get("authorization")) {
            let authorization=req.headers.get("authorization").split(" ");
            if (authorization[0]!="Bearer")
                throw new Error("Expected bearer authorization");

            let payload=jwtVerify(authorization[1],this.conf.jwtSecret);
            return payload.userId;
        }

        if (req.headers.get("cookie")) {
            let cookies=parseCookie(req.headers.get("cookie"));
            if (cookies.qmtoken) {
                let payload=jwtVerify(cookies.qmtoken,this.conf.jwtSecret);
                if (payload.userId)
                    return payload.userId;
            }
        }
    }

    async getUserByRequest(req) {
        let userId=this.getUserIdByRequest(req);
        if (!userId)
            return;

        let userRecord=await this.db.findOne(this.authCollection,{id: userId});
        return userRecord;
    }

    async getRoleByUserId(userId) {
        if (userId==-1)
            return "admin";

        if (!userId)
            return "public";

        if (!this.authCollection)
            return "public";

        let userRecord=await this.db.findOne(this.authCollection,{id: userId});
        if (!userRecord)
            return "public";

        let roleField=this.getTaggedCollectionField(this.authCollection,"role",true);
        return userRecord[roleField];
    }

    async getRoleByRequest(req) {
        return this.getRoleByUserId(this.getUserIdByRequest(req));
    }

    async getRequestFormData(req) {
        let exts=[".jpg",".jpeg",".png",".webp"];
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
                    if (field.id!="id" && field.sqlType) {
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
        }

        let migrator=new DbMigrator({
            runQueries: this.db.runQueries,
            tables: tables,
            dryRun: dryRun,
            force: force,
            transaction: this.db.hasTransactionSupport()
        });

        await migrator.sync();
    }

    async getContentFiles() {
        let contentFiles=[];
        for (let c in this.collections) {
            let collection=this.collections[c];
            if (!collection.isView())
                contentFiles=[
                    ...contentFiles,
                    ...await collection.getContentFiles()
                ];
        }

        return contentFiles;
    }

    async getMissingContentFiles() {
        let contentFiles=await this.getContentFiles();
        let storageFiles=await this.storage.listFiles();
        let missing=contentFiles.filter(f=>!storageFiles.includes(f));

        return missing;
    }

    async garbageCollect({dryRun}) {
        dryRun=!!dryRun;
        console.log("Garbage collect, dryRun="+dryRun);

        let contentFiles=await this.getContentFiles();
        let storageFiles=await this.storage.listFiles();

        let sync=storageFiles.filter(f=>contentFiles.includes(f));
        let garbage=storageFiles.filter(f=>!contentFiles.includes(f));
        let missing=contentFiles.filter(f=>!storageFiles.includes(f));

        if (!dryRun) {
            for (let f of garbage) {
                await this.storage.deleteFile(f);
            }
        }

        return {
            sync: sync.length,
            garbage: garbage.length,
            missing: missing.length,
            dryRun: dryRun
        }
    }
}