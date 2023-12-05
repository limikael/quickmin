#!/usr/bin/env node

import path from 'path';
import {fileURLToPath} from 'url';
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pkg=JSON.parse(fs.readFileSync(path.join(__dirname,"../../package.json"),"utf8"));
console.log("Updating package info: "+pkg.version);

let info={
	version: pkg.version
};

let content="export default "+JSON.stringify(info,null,2)
fs.writeFileSync(path.join(__dirname,"package-info.js"),content);
