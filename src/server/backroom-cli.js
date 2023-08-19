#!/usr/bin/env node

import yargs from "yargs/yargs";
import {hideBin} from "yargs/helpers";
import Backroom from "./Backroom.js";
import http from "http";
import yaml from "yaml";
import fs from "fs";

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
    .option("sync",{
        default: true,
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

let server=http.createServer(backroom.middleware);

await server.listen(options.port);
console.log("Server listening on port ",options.port)