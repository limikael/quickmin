import {Sequelize, DataTypes} from "sequelize";
import SequelizeRest from "../utils/SequelizeRest.js";
import {trimChar} from "../utils/js-util.js";
import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";

let SEQUELIZE_TYPES={
    "text": DataTypes.STRING,
    "richtext": DataTypes.TEXT,
    "date": DataTypes.DATEONLY,
    "datetime": DataTypes.DATE,
    "select": DataTypes.STRING
}

export default class Quickmin {
    constructor(conf={}) {
        Object.assign(this,conf);

        this.sequelize=new Sequelize(this.dsn);

        if (this.jwtSecret && this.adminUser && this.adminPass)
            this.requireAuth=true;

        else if (this.jwtSecret || this.adminUser || this.adminPass)
            throw new Error("Need none or all of adminUser, adminPass and jwtSecret");

        for (let c in this.collections) {
            if (!this.collections[c].title)
                this.collections[c].title=c.charAt(0).toUpperCase()+c.slice(1);

            if (!this.collections[c].listFields)
                this.collections[c].listFields=Object.keys(this.collections[c].fields);

            for (let f in this.collections[c].fields) {
                if (typeof this.collections[c].fields[f]=="string") {
                    this.collections[c].fields[f]={
                        type: this.collections[c].fields[f]
                    }
                }

                if (!SEQUELIZE_TYPES[this.collections[c].fields[f].type])
                    throw new Error("Unknown field type: "+this.collections[c].fields[f].type);
            }
        }

        for (let c in this.collections) {
            let attrs={}
            for (let f in this.collections[c].fields) {
                attrs[f]={
                    type: SEQUELIZE_TYPES[this.collections[c].fields[f].type]
                }
            }

            this.sequelize.define(c,attrs)
        }

        let sequelizeRestConf={
            sequelize: this.sequelize,
        };

        sequelizeRestConf.authorizeWrite=this.authorizeWrite;
        this.sequelizeRest=new SequelizeRest(sequelizeRestConf);

        this.middleware=express();
        this.middleware.use(bodyParser.json());
        this.middleware.use((req,res,next)=>{
            res.setHeader("Access-Control-Allow-Methods", "*");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Headers", "*");
            res.setHeader("Access-Control-Expose-Headers", "*");
            next();
        });

        this.middleware.get("/_schema",(req, res)=>{
            res.json({
                collections: this.collections,
                requireAuth: this.requireAuth
            });
        });

        this.middleware.post("/_login",(req, res)=>{
            if (req.body.username==this.adminUser &&
                    req.body.password==this.adminPass) {
                let payload={
                    username: req.body.username
                };

                res.json({
                    token: jwt.sign(payload,this.jwtSecret,{})
                });
            }

            else {
                res.status(403);
                res.json({"message":"Bad credentials"})
            }
        });

        this.middleware.use(this.sequelizeRest.middleware);
    }

    authorizeWrite=(req)=>{
        if (!this.requireAuth)
            return;

        let authorization=req.headers.authorization.split(" ");
        if (authorization[0]!="Bearer")
            throw new Error("Expected bearer authorization");

        let payload=jwt.verify(authorization[1],this.jwtSecret);
        if (payload.username!=this.adminUser)
            throw new Error("Not logged in");
    }

    async sync(options) {
        await this.sequelize.sync(options);
    }
}