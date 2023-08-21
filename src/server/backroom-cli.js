#!/usr/bin/env node

import yargs from "yargs/yargs";
import {hideBin} from "yargs/helpers";
import Backroom from "./Backroom.js";
import http from "http";
import yaml from "yaml";
import fs from "fs";
import express from "express";
import path from 'path';
import {fileURLToPath} from 'url';
import {removeDoubleSlashMiddleware} from "../utils/express-util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let yargsConf=yargs(hideBin(process.argv))
    .option("port",{
        type: "number",
        default: 3000,
        description: "Port to listen to.",
    })
    .option("conf",{
        default: "backroom.yaml",
        description: "Config file.",
    })
    .option("ui",{
        description: "Serve web ui.",
        choices: ["none","dist","vite"],
        default: "dist",
    })
    .option("sync",{
        description: "Sync database schema on startup.",
        choices: ["none","safe","alter","force"],
        default: "alter"
    })
    .usage("backroom -- Backend as an app.")

let options=yargsConf.parse();

if (!fs.existsSync(options.conf)) {
    console.log("Can't find config file:",options.conf);
    console.log();
    yargsConf.showHelp();
    process.exit(1);
}

let conf=yaml.parse(fs.readFileSync(options.conf,"utf8"));
let backroom=new Backroom(conf);

switch (options.sync) {
    case "safe":
        await backroom.sync({});
        break;

    case "alter":
        await backroom.sync({alter: true});
        break;

    case "force":
        await backroom.sync({force: true});
        break;
}

let app=express();
app.use(removeDoubleSlashMiddleware());
app.use(backroom.middleware);

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