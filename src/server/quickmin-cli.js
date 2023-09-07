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
    .option("storage",{
        description: "Storage driver to use.",
        choices: ["node"],
        default: "node"
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

if (options.sync)
    await quickmin.sync();

let app=new Hono();
app.use("*",async (c, next)=>{
    res=await quickmin.handleRequest(c.req.raw);

    if (res)
        return res;

    return await next();
});

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
        app.use("*",serveStatic({root: "dist"}));
        break;

    case "vite":
        throw new Error("vite currently unsupported");

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
        break;
}

let res=serve({
    fetch: app.fetch,
    port: options.port
},()=>{
    console.log("Server listening on port ",options.port)    
});

