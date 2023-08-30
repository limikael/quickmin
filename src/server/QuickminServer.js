import {trimChar} from "../utils/js-util.js";
//import SequelizeDb from "../db/SequelizeDb.js";
import DrizzleDb from "../db/DrizzleDb.js";
import {netTry} from "../utils/js-util.js";
import {jwtSign, jwtVerify} from "../utils/jwt-util.js";
import DbMigrator from "../migrate/DbMigrator.js";

let FIELD_TYPES=[
    "text",
    "richtext",
    "date",
    "datetime",
    "select",
];

function parseReq(req) {
    if (!req.hasOwnProperty("url")
            || typeof req.headers==="undefined"
            || !req.hasOwnProperty("method")
            || !req.hasOwnProperty("body"))
        throw new Error("Expected req to have method, url, headers and body. "+JSON.stringify(req));

    let urlSplit=req.url.split("?");
    let urlPath=urlSplit[0].replace(/\/+/g,"/");
    let urlReplaced=[urlPath,...urlSplit.slice(1)].join("?");
    let url=new URL(urlReplaced,"http://example.com/");

    return {
        argv: url.pathname.split("/").filter(s=>s.length>0),
        query: Object.fromEntries(new URLSearchParams(url.search)),
        headers: req.headers,
        method: req.method,
        body: req.body
    };
}

function canonicalizeConf(conf) {
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
        Object.assign(this,canonicalizeConf(conf));

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

    handleRequest=async (req, res={})=>{
        req=parseReq(req);

        if (this.apiPath) {
            if (req.argv[0]!=this.apiPath)
                return;

            req.argv.shift();
        }

        //console.log(req);

        if (this.isPathRequest(req,"GET","_schema")) {
            return {
                collections: this.collections,
                requireAuth: this.requireAuth
            };
        }

        else if (this.isPathRequest(req,"POST","_login")) {
            //console.log("it is a post..");
            //console.log(req.body);

            if (req.body.username==this.adminUser &&
                    req.body.password==this.adminPass) {
                let payload={
                    username: req.body.username
                };

                let token=jwtSign(payload,this.jwtSecret);
                return {
                    token: token
                };
            }

            else {
                res.statusCode=403;
                return {"message":"Bad credentials"}
            }
        }

        else if (this.isModelRequest(req,"GET",1)) {
            res.headers={"Content-Range": "0-2/2"};
            return await this.db.findMany(
                req.argv[0]
            );
        }

        else if (this.isModelRequest(req,"GET",2)) {
            return await this.db.findOne(
                req.argv[0],
                req.argv[1]
            );
        }

        else if (this.isModelRequest(req,"POST",1)) {
            this.authorizeWrite(req);
            return await this.db.insert(
                req.argv[0],
                req.body
            );
        }

        else if (this.isModelRequest(req,"PUT",2)) {
            this.authorizeWrite(req);
            return await this.db.update(
                req.argv[0],
                req.argv[1],
                req.body
            );
        }

        else if (this.isModelRequest(req,"DELETE",2)) {
            this.authorizeWrite(req);
            return await this.db.delete(
                req.argv[0],
                req.argv[1],
            );
        }
    }

    middleware=(req, res, next)=>{
        this.handleRequest(req,res)
            .then(data=>{
                if (data===undefined) {
                    if (next)
                        return next();

                    res.statusCode=404;
                    res.end("Not found.");
                    return;
                }

                for (let h in res.headers)
                    res.setHeader(h,res.headers[h]);

                res.setHeader("Content-Type","application/json");
                res.end(JSON.stringify(data));
            })
            .catch(e=>{
                console.error(e);

                res.statusCode=500;
                if (e instanceof Error)
                    e=JSON.stringify({
                        message: e.message,
                        stack: e.stack
                    });

                res.end(String(e));
            })
    }

    authorizeWrite(req) {
        if (!this.requireAuth)
            return;

        if (!req.headers.authorization)
            throw new Error("Expected bearer authorization");

        let authorization=req.headers.authorization.split(" ");
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