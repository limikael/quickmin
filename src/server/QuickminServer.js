import {splitPath, jsonEq, getFileExt, parseCookie, DeclaredError} from "../utils/js-util.js";
import {jwtSign, jwtVerify} from "../utils/jwt-util.js";
import {getElementsByTagName, getElementByTagName} from "../utils/xml-util.js";
import Collection from "./Collection.js";
import urlJoin from "url-join";
import {minimatch} from 'minimatch';
import QuickminServerApi from "./QuickminServerApi.js";
import {googleAuthDriver} from "../auth/google-auth.js";
import {microsoftAuthDriver} from "../auth/microsoft-auth.js";
import {emailAuthDriver} from "../auth/email-auth.js";
import {facebookAuthDriver} from "../auth/facebook-auth.js";
import {loaderTemplate} from "../ui/loader-template.js";
import packageInfo from "../build/package-info.js";
import {Qql, QqlRestServer, QqlServer} from "qql";
import {quickminCanonicalizeConf, quickminMergeConf} from "./quickmin-conf-util.js";

export {quickminCanonicalizeConf, quickminMergeConf};

export class QuickminServer {
    constructor(confYaml, drivers=[]) {
        this.conf={...quickminCanonicalizeConf(confYaml)};
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
            let collectionConf=this.conf.collections[collectionId];

            this.collections[collectionId]=new Collection(
                collectionId,
                collectionConf,
                this
            );
        }

        if (!this.conf.cookie)
            this.conf.cookie="qmtoken";

        if (!this.conf.apiPath)
            this.conf.apiPath="";

        if (!this.conf.jwtSecret)
            throw new DeclaredError("The config option jwtSecret must be provided.");

        drivers=[...drivers,
            googleAuthDriver,
            microsoftAuthDriver,
            facebookAuthDriver,
            emailAuthDriver
        ];

        for (let driver of drivers)
            driver(this);

        // Initialize auth method.
        for (let cid in this.collections) {
            if (!this.collections[cid].isView()) {
                for (let fid in this.collections[cid].fields) {
                    let field=this.collections[cid].fields[fid];
                    if (field.type=="authmethod") {
                        if (!this.authMethods[field.provider])
                            throw new Error("Auth provider not set up: "+field.provider);

                        if (this.authCollection && this.authCollection!=cid)
                            throw new Error("Only one collection can be used for auth.");

                        this.authCollection=cid;
                        this.authMethods[field.provider].fieldId=fid;
                    }
                }
            }
        }

        if (this.conf.adminUser || this.conf.adminPass)
            if (!this.conf.adminUser || !this.conf.adminPass)
                throw new DeclaredError("Need both adminUser and adminPass, not just one.");

        if (!this.authCollection && !this.conf.adminUser)
            throw new DeclaredError(
                "No auth methods configured. "+
                "Either create a 'god user' by settng adminUser/adminPass, or define an auth "+
                "table by creating an field with an authMethod."
            );

        this.api=new QuickminServerApi(this);

        if (!this.conf.bundleUrl)
            this.conf.bundleUrl=`https://unpkg.com/quickmin@${packageInfo.version}/dist/quickmin-bundle.js`;

        if (this.conf.uninitialized)
            return;

        let qqlTables={};
        for (let collectionId in this.collections)
            qqlTables[collectionId]=this.collections[collectionId].getQqlDef();

        if (this.conf.qqlDriver)
            this.qqlDriver=this.conf.qqlDriver;

        if (!this.qqlDriver)
            throw new Error("No database driver configured.");

        if (this.isStorageUsed() && !this.storage)
            throw new Error("There are fields using storage, but no storage driver.");

        this.qql=new Qql({
            tables: qqlTables,
            driver: this.qqlDriver
        });

        this.qqlRestServer=new QqlRestServer(this.qql,{
            path: this.conf.apiPath,
            putFile: async (fn,file)=>{
                //console.log("from qql rest server... the storage=",this.storage);
                await this.storage.putFile(fn,file)
            }
        });

        this.qqlServer=new QqlServer(this.qql,{
            path: urlJoin(this.conf.apiPath,"_qql")
        });
    }

    isStorageUsed() {
        let storageUsed=false;
        for (let c in this.collections) {
            let collection=this.collections[c];
            if (!collection.isView())
                storageUsed||=collection.isStorageUsed();
        }

        return storageUsed;
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
        try {
            return await this.safeHandleRequest(req);
        }

        catch (e) {
            console.log("**** quickmin request error");
            console.log(e);
            console.log("**** that was the error");
            return new Response(e.message,{status: 500});
        }
    }

    safeHandleRequest=async (req)=>{
        //await new Promise(resolve=>setTimeout(resolve,500));

        let argv=splitPath(new URL(req.url).pathname);

        if (this.conf.apiPath) {
            let splitApiPath=splitPath(this.conf.apiPath);
            while (splitApiPath.length) {
                if (argv[0]!=splitApiPath[0])
                    return;

                argv.shift();
                splitApiPath.shift();
            }
        }

        //await new Promise(r=>setTimeout(r,1000));

        if (argv.length==0) {
            /*console.log("url: "+req.url);
            console.log("headers",req.headers);*/
            let u=new URL(req.url);

            // for ngrok
            if (req.headers.get("x-forwarded-proto") &&
                    req.headers.get("x-forwarded-proto")=="https")
                u.protocol="https:";

            let loaderProps={
                api: urlJoin(u.origin,this.conf.apiPath),
                bundleUrl: this.conf.bundleUrl
            };

            let index=loaderTemplate.replaceAll(
                "$$LOADER_PROPS$$",
                JSON.stringify(loaderProps)
            );

            return new Response(index,{
                headers: {
                    "content-type": "text/html;charset=UTF-8",
                }
            });
        }

        else if (argv[0]=="_dist" && this.distHandler) {
            return await this.distHandler(argv[1]);
//            return new Response("hello");
        }

        else if (argv[0]=="_content") {
            let path=new URL(req.url).pathname; // does it do anything?
            return await this.storage.getResponse(argv[1],req);
        }

        else if (jsonEq(argv,["_getCurrentUser"])) {
            //console.log("headers in _getCurrentUser: ",req.headers);

            let userId=this.getUserIdByRequest(req);
            if (!userId)
                return Response.json(null);

            let userRecord=await this.qql.query({
                oneFrom: this.authCollection,
                where: {
                    id: userId
                }
            });
            if (!userRecord)
                return Response.json(null);

            //console.log("id: ",userId," record: ",userRecord);

            return Response.json(userRecord);
        }

        else if (jsonEq(argv,["_tokenLogin"])) {
            let reqUrl=new URL(req.url);
            let redirect=reqUrl.searchParams.get("redirect");
            let jwtToken=reqUrl.searchParams.get("token");
            let {token, provider}=jwtVerify(jwtToken,this.conf.jwtSecret);

            return await this.getLoginRedirectResponse(redirect,provider,token);
        }

        else if (req.method=="GET" && jsonEq(argv,["_oauthRedirect"])) {
            let reqUrl=new URL(req.url);
            //console.log("redirect state: ",JSON.parse(reqUrl.searchParams.get("state")));

            let {provider,referer}=JSON.parse(reqUrl.searchParams.get("state"));
            let loginToken=await this.authMethods[provider].process(reqUrl);

            return await this.getLoginRedirectResponse(referer,provider,loginToken);
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
            let reUrl=urlJoin(reqUrl.origin,this.conf.apiPath)+"/#";

            let collectionsSchema={};
            for (let cid in this.collections)
                collectionsSchema[cid]=this.collections[cid].getSchema();

            return Response.json({
                collections: collectionsSchema,
                cookie: this.conf.cookie,
                requireAuth: true, //this.requireAuth,
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

            /*console.log("recv upload");
            throw new Error("nope, no data for you!!");*/

            let data=await this.qqlRestServer.decodeRequestData(req);
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

        else if (req.method=="POST" && jsonEq(argv,["_qql"])) {
            let env=this.qql.env({
                role: await this.getRoleByRequest(req),
                uid: await this.getUserIdByRequest(req)
            });

            return await this.qqlServer.handleEnvRequest(env,req);
        }

        else if (this.collections[argv[0]]) {
            let env=this.qql.env({
                role: await this.getRoleByRequest(req),
                uid: await this.getUserIdByRequest(req)
            });

            return await this.qqlRestServer.handleEnvRequest(env,req);
        }
    }

    async getLoginRedirectResponse(referer, provider, loginToken) {
        console.log("login: "+provider+":"+loginToken+" -> "+referer);

        if (!this.authMethods[provider].fieldId)
            throw new Error("No AuthMethod field set up for provider: "+provider);

        let q={};
        q[this.authMethods[provider].fieldId]=loginToken;

        let userRecord=await this.qql.query({
            oneFrom: this.authCollection,
            where: q
        });
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

            userRecord=await this.qql.query({
                insertInto: this.authCollection,
                set: q,
                return: "item"
            });
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
        headers.set("set-cookie",this.conf.cookie+"="+token+"; path=/");
        /*headers.set("access-control-expose-headers","Set-Cookie");
        headers.set("Access-Control-Allow-Credentials",true);
        headers.set("Access-Control-Allow-Origin","http://localhost:3000");*/

        return new Response("Moved",{
            status: 302,
            headers: headers
        });
    }

    async getAuthUrls(referer, state={}) {
        let u=new URL(referer);
        let hostConf=this.getHostConf(u.hostname);
        if (hostConf.oauthHostname)
            u.hostname=hostConf.oauthHostname;

        let reurl=urlJoin(u.origin,this.conf.apiPath,"_oauthRedirect");

        let authUrls={};
        for (let method in this.authMethods) {
            if (this.authMethods[method].getLoginUrl) {
                let wrappedState=JSON.stringify({
                    referer: referer,
                    provider: method,
                    ...state
                });
                authUrls[method]=this.authMethods[method].getLoginUrl(reurl,wrappedState);
            }
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

        let cookieHeader=req.headers.get("cookie");
        if (req.headers.get("x-cookie"))
            cookieHeader=req.headers.get("x-cookie");

        if (cookieHeader) {
            let cookies=parseCookie(cookieHeader);
            if (cookies[this.conf.cookie]) {
                try {
                    let payload=jwtVerify(cookies[this.conf.cookie],this.conf.jwtSecret);
                    if (payload.userId)
                        return payload.userId;
                }

                catch (e) {
                    console.log("token error: "+e.message);
                }
            }
        }
    }

    async getUserByRequest(req) {
        let userId=this.getUserIdByRequest(req);
        if (!userId)
            return;

        if (!this.authCollection)
            return;

        let userRecord=await this.qql.query({
            oneFrom: this.authCollection,
            where: {
                id: userId
            }
        });
        return userRecord;
    }

    async getRoleByUserId(userId) {
        if (userId==-1)
            return "admin";

        if (!userId)
            return "public";

        if (!this.authCollection)
            return "public";

        let userRecord=await this.qql.query({
            oneFrom: this.authCollection,
            where: {
                id: userId
            }
        });
        if (!userRecord)
            return "public";

        let roleField=this.getTaggedCollectionField(this.authCollection,"role",true);
        return userRecord[roleField];
    }

    async getRoleByRequest(req) {
        return this.getRoleByUserId(this.getUserIdByRequest(req));
    }

    async sync({dryRun, force, test, risky}) {
        if (!this.qql)
            throw new Error("Can't migrate, no qql driver configured.");

        await this.qql.migrate({
            dryRun,
            force,
            test,
            risky
        });
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

    async garbageCollect({dryRun}={}) {
        dryRun=!!dryRun;

        if (!this.isStorageUsed()) {
            console.log("No gc, because no storage...");
            return;
        }

        console.log("Garbage collect, dryRun="+dryRun);

        let contentFiles=await this.getContentFiles();
        let storageFiles=await this.storage.listFiles();

        let sync=storageFiles.filter(f=>contentFiles.includes(f));
        let garbage=storageFiles.filter(f=>!contentFiles.includes(f));
        let missing=contentFiles.filter(f=>!storageFiles.includes(f));

        if (!dryRun) {
            for (let f of garbage) {
                console.log("Garbage: "+f);
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

export default QuickminServer;