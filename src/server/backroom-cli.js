#!/usr/bin/env node

import yargs from "yargs/yargs";
import {hideBin} from "yargs/helpers";
import Backroom from "./Backroom.js";
import http from "http";
import yaml from "yaml";
import fs from "fs";

let options=yargs(hideBin(process.argv))
    .option("port",{
        type: "number",
        default: 3000,
        description: "Port to listen to",
    })
    .option("conf",{
        default: "backroom.yaml",
        description: "Config file",
    })
    .parse();

let conf=yaml.parse(fs.readFileSync(options.conf,"utf8"));
let backroom=new Backroom(conf);

await backroom.sync();

let server=http.createServer(backroom.middleware);

await server.listen(options.port);
console.log("Server listening on port ",options.port)