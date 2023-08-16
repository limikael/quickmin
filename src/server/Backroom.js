import {Sequelize, DataTypes} from "sequelize";
import {getRequestOpts} from "../utils/js-util.js";
import SequelizeRest from "../utils/SequelizeRest.js";

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
    }

    async sync() {
        await this.sequelize.sync({alter: true});
    }

    middleware=async (req, res, next)=>{
        let opts=getRequestOpts(req);

        if (opts._.length==1 && opts._[0]=="_schema") {
            res.setHeader('Access-Control-Allow-Origin', '*');

            res.end(JSON.stringify({
                collections: this.collections
            }));
        }

        else {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Headers", "*");
            res.setHeader("Access-Control-Expose-Headers", "*");
            this.sequelizeRest.handle(req,res,next);
        }
    }
}