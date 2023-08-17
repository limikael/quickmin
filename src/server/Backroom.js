import {Sequelize, DataTypes} from "sequelize";
import SequelizeRest from "../utils/SequelizeRest.js";
import {trimChar} from "../utils/js-util.js";
import express from "express";

let SEQUELIZE_TYPES={
    "text": DataTypes.STRING,
    "richtext": DataTypes.TEXT
}

export default class Backroom {
    constructor(conf={}) {
        Object.assign(this,conf);

        this.sequelize=new Sequelize(this.dsn);

        for (let c in this.collections) {
            if (!this.collections[c].title)
                this.collections[c].title=c.charAt(0).toUpperCase()+c.slice(1);

            for (let f in this.collections[c].fields) {
                if (typeof this.collections[c].fields[f]=="string") {
                    this.collections[c].fields[f]={
                        type: this.collections[c].fields[f]
                    }
                }
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

        this.sequelizeRest=new SequelizeRest({
            sequelize: this.sequelize
        });

        let apiRoot=trimChar(conf.apiRoot,"/");
        if (apiRoot)
            apiRoot="/"+apiRoot;

        this.middleware=express();
        this.middleware.use((req,res,next)=>{
            res.setHeader("Access-Control-Allow-Methods", "*");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Headers", "*");
            res.setHeader("Access-Control-Expose-Headers", "*");
            next();
        });

        this.middleware.get(`${apiRoot}/_schema`,(req, res, next)=>{
            res.json({
                collections: this.collections
            });
        });

        this.middleware.use(this.sequelizeRest.middleware);
    }

    async sync() {
        //await this.sequelize.sync({alter: true});
        await this.sequelize.sync();
    }
}