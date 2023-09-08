#!/usr/bin/env node

import yargs from "yargs/yargs";
import {hideBin} from "yargs/helpers";
import QuickminServer from "./QuickminServer.js";
import yaml from "yaml";
import fs from "fs";
import path from 'path';
import {fileURLToPath} from 'url';
import {Hono} from 'hono'
import {serve} from '@hono/node-server'
import {serveStatic} from '@hono/node-server/serve-static'
import {configureDrizzleSqlite} from "../export/drizzle-sqlite.js";
import {configureNodeStorage} from "../export/node-storage.js";
import isoqBundler from "isoq/bundler";
import urlJoin from 'url-join';

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
        description: "Serve web UI.",
        type: "boolean",
        default: true
    })
    .option("rebuild-ui",{
        description: "Rebuild web UI even if it exists.",
        type: "boolean",
    })
    .option("driver",{
        description: "Database driver to use.",
        choices: ["sequelize","drizzle"],
        default: "drizzle"
    })
    .option("storage",{
        description: "Storage driver to use.",
        choices: ["node"],
        default: "node"
    })
    .usage("quickmin -- Backend as an app or middleware.")

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
        configureSequelize(conf);
        break;

    case "drizzle":
        configureDrizzleSqlite(conf);
        break;
}

switch (options.storage) {
    case "node":
        configureNodeStorage(conf);
        break;
}

let quickmin=new QuickminServer(conf);

let app=new Hono();

app.use("*",async (c, next)=>{
    res=await quickmin.handleRequest(c.req.raw);

    if (res)
        return res;

    return await next();
});

if (options.ui) {
    if (!fs.existsSync(path.join(__dirname,"../../dist"))
            || options.rebuildUi) {
        console.log("Bundling client...");

        await isoqBundler({
            entryPoint: path.join(__dirname,"../ui/main.jsx"),
            outdir: path.join(__dirname,"../../dist"),
            contentdir: path.join(__dirname,"../../dist/content"),
            splitting: true,
            quiet: true
        });
    }

    let p=path.join(__dirname,"../../dist/content");
    app.use("*", serveStatic({root: path.relative("",p)}))

    function getProps(req) {
        let u=new URL(req.url);
        return {api: urlJoin(u.origin,quickmin.apiPath)};
    }

    let mwPath=path.join(__dirname,"../../dist/isoq-hono.js");
    let mwModule=await import(mwPath);
    app.use("*",mwModule.default({
        localFetch: app.fetch,
        props: getProps
    }));
}

let res=serve({
    fetch: app.fetch,
    port: options.port
},(info)=>{
    let base=`http://localhost:${info.port}`
    console.log("UI available at:");
    console.log(`  ${base}/`);
    console.log();
    console.log("REST endpoints at:");
    for (let k in quickmin.collections)
        console.log(`  ${urlJoin(base,quickmin.apiPath,k)}`);
});

