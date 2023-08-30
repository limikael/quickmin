#!/usr/bin/env node

import yargs from "yargs/yargs";
import {hideBin} from "yargs/helpers";
import QuickminServer from "./QuickminServer.js";
import http from "http";
import yaml from "yaml";
import fs from "fs";
import express from "express";
import path from 'path';
import {fileURLToPath} from 'url';
import {removeDoubleSlashMiddleware} from "../utils/express-util.js";
import Database from 'better-sqlite3';
import {drizzle} from 'drizzle-orm/better-sqlite3';
import {Sequelize, DataTypes} from "sequelize";
import bodyParser from "body-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let yargsConf=yargs(hideBin(process.argv))
    .option("port",{
        type: "number",
        default: 3000,
        description: "Port to listen to.",
    })
    .option("conf",{
        default: "quickmin.yaml",
        description: "Config file.",
    })
    .option("ui",{
        description: "Serve web ui.",
        choices: ["none","dist","vite"],
        default: "dist",
    })
    .option("sync",{
        description: "Sync database schema on startup.",
        type: "boolean",
        default: false
    })
    .option("driver",{
        description: "Database driver to use.",
        choices: ["sequelize","drizzle"],
        default: "sequelize"
    })
    .usage("quickmin -- Backend as an app.")

let options=yargsConf.parse();

if (!fs.existsSync(options.conf)) {
    console.log("Can't find config file:",options.conf);
    console.log();
    yargsConf.showHelp();
    process.exit(1);
}

let conf=yaml.parse(fs.readFileSync(options.conf,"utf8"));

switch (options.driver) {
    case "sequelize":
        conf.sequelize=new Sequelize(conf.dsn);
        break;

    case "drizzle":
        let dsnUrl=new URL(conf.dsn);
        if (dsnUrl.protocol!="sqlite:")
            throw new Error("Only sqlite supported with drizzle");

        let sqlite=new Database(dsnUrl.pathname);
        conf.drizzle=drizzle(sqlite);
}

let quickmin=new QuickminServer(conf);

if (options.sync)
    await quickmin.sync();

let app=express();
app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Expose-Headers", "*");
    if (req.method=="OPTIONS") {
        res.sendStatus(200);
    }

    next();
});
//app.use(removeDoubleSlashMiddleware());
app.use(bodyParser.json());
app.use(quickmin.middleware);

switch (options.ui) {
    case "dist":
        if (!fs.existsSync(path.join(__dirname,"..","..","dist"))) {
            console.log("No UI files found, try:");
            console.log();
            console.log("  --ui=none  To run in headless mode.");
            console.log("  --ui=vite  To start a vite dev server.");
            console.log();
            process.exit(1);
        }
        app.use(express.static(path.join(__dirname,"..","..","dist")));
        break;

    case "vite":
        let vite=await import("vite");
        let preact=(await import("@preact/preset-vite")).default;

        let viteServer=await vite.createServer({
            configFile: false,
            clearScreen: false,
            root: path.join(__dirname,"..",".."),
            plugins: [preact()],
            server: {
                middlewareMode: true,
            }
        });

        app.use(viteServer.middlewares);
        break;
}

let server=http.createServer(app);

await server.listen(options.port);

console.log("Server listening on port ",options.port)