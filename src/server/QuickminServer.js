import {netTry, splitPath} from "../utils/js-util.js";
import {jwtSign, jwtVerify} from "../utils/jwt-util.js";
import DbMigrator from "../migrate/DbMigrator.js";
import {parse as parseXml} from "txml";
import {parse as parseYaml} from "yaml";
import {getElementsByTagName, getElementByTagName} from "../utils/xml-util.js";
import ClientOAuth2 from "client-oauth2";

export default class QuickminServer {
    constructor(confYaml, drivers=[]) {
        let SQL_TYPES={
            "text": "text",
            "richtext": "text",
            "date": "date",
            "datetime": "datetime",
            "select": "text",
            "image": "text",
            "authmethod": "text",
            "roleselect": "text"
        };

        if (typeof confYaml=="string")
            confYaml=parseYaml(confYaml);

        this.conf=confYaml;
        this.authMethods={};

        this.roles=this.conf.roles;
        if (!this.roles)
            this.roles=[];

        this.collections={};
        for (let collectionId in this.conf.collections) {
            let collectionConf=this.conf.collections[collectionId];

            let collection={
                id: collectionId,
                fields: {},
                listFields: [],
                role: collectionConf.role,
                writeRole: collectionConf.writeRole
            }

            if (collection.role && this.roles.indexOf(collection.role)<0)
                throw new Error("Unknown role: "+collection.role);

            if (collection.writeRole && this.roles.indexOf(collection.writeRole)<0)
                throw new Error("Unknown write role: "+collection.writeRole);

            collection.roleLevel=this.roles.indexOf(collection.role);
            collection.writeRoleLevel=this.roles.indexOf(collection.writeRole);

            if (collection.writeRoleLevel<0)
                collection.writeRoleLevel=0;

            if (collection.writeRoleLevel<collection.roleLevel)
                collection.writeRoleLevel=collection.roleLevel;

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

                if (type=="authmethod") {
                    this.authMethods[fieldEl.attributes.provider]={
                        collectionId: collectionId,
                        fieldId: fieldEl.attributes.id
                    }
                }

                if (type=="roleselect") {
                    fieldEl.attributes.choices=this.conf.roles;
                    fieldEl.attributes.role=true;
                }

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

    createGoogleAuthClient(redirectUri) {
        return new ClientOAuth2({
            clientId: this.conf.googleClientId,
            clientSecret: this.conf.googleClientSecret,
            accessTokenUri: 'https://oauth2.googleapis.com/token',
            authorizationUri: 'https://accounts.google.com/o/oauth2/auth',
            redirectUri: redirectUri,
            scopes: ['https://www.googleapis.com/auth/userinfo.email']
        });
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

    getTaggedCollectionField(collectionId, tag, value) {
        for (let fieldId in this.collections[collectionId].fields)
            if (this.collections[collectionId].fields[fieldId][tag]==value)
                return fieldId;
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
            let u=new URL(req.headers.get("referer"))
            let reurl=u.origin+u.pathname;

            return Response.json({
                collections: this.collections,
                requireAuth: this.requireAuth,
                googleAuthUrl: await this.createGoogleAuthClient(reurl).code.getUri()
            });
        }

        else if (this.isPathRequest(req,"POST","_googleLogin")) {
            let body=await req.json();
            let u=new URL(req.headers.get("referer"))
            let reurl=u.origin+u.pathname;

            let res=await this.createGoogleAuthClient(reurl).code.getToken(body.url);
            let apiUrl="https://oauth2.googleapis.com/tokeninfo?"+new URLSearchParams({
                id_token: res.data.id_token
            });

            let response=await fetch(apiUrl);
            let tokenInfo=await response.json();

            let q={};
            q[this.authMethods.google.fieldId]=tokenInfo.email;

            let collectionId=this.authMethods.google.collectionId;
            let userRecord=await this.db.findOne(collectionId,q);
            let usernameField=this.getTaggedCollectionField(collectionId,"username",true);

            let payload={
                provider: "google",
                id: userRecord.id,
            };

            let token=jwtSign(payload,this.conf.jwtSecret);
            return Response.json({
                username: userRecord[usernameField],
                roleLevel: await this.getRoleLevelByPayload(payload),
                token: token
            });
        }

        else if (this.isPathRequest(req,"POST","_login")) {
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

        else if (this.isModelRequest(req,"GET",1)) {
            let c=this.collections[req.argv[0]];
            await this.assertRequestRoleLevel(req,c.roleLevel);
            return Response.json(await this.db.findMany(
                req.argv[0]
            ),{headers:{"Content-Range": "0-2/2"}});
        }

        else if (this.isModelRequest(req,"GET",2)) {
            let c=this.collections[req.argv[0]];
            await this.assertRequestRoleLevel(req,c.roleLevel);
            let item=await this.db.findOne(req.argv[0],{
                id: req.argv[1]
            });

            if (!item)
                return new Response("Not found",{status: 404});

            return Response.json(item);
        }

        else if (this.isModelRequest(req,"POST",1)) {
            let c=this.collections[req.argv[0]];
            await this.assertRequestRoleLevel(req,c.writeRoleLevel);
            return Response.json(await this.db.insert(
                req.argv[0],
                await this.getRequestFormData(req)
            ));
        }

        else if (this.isModelRequest(req,"PUT",2)) {
            let c=this.collections[req.argv[0]];
            await this.assertRequestRoleLevel(req,c.writeRoleLevel);
            return Response.json(await this.db.update(
                req.argv[0],
                req.argv[1],
                await this.getRequestFormData(req)
            ));
        }

        else if (this.isModelRequest(req,"DELETE",2)) {
            let c=this.collections[req.argv[0]];
            await this.assertRequestRoleLevel(req,c.writeRoleLevel);
            return Response.json(await this.db.delete(
                req.argv[0],
                req.argv[1],
            ));
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