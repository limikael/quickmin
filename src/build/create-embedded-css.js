#!/usr/bin/env node

import path from 'path';
import {fileURLToPath} from 'url';
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let imageContent=fs.readFileSync(path.join(__dirname,"../../node_modules/jsoneditor/dist/img/jsoneditor-icons.svg"),"utf8");
let encodedImageContent=btoa(imageContent);

//let content=fs.readFileSync(path.join(__dirname,"../../node_modules/jsoneditor/dist/jsoneditor.css"),"utf8")
let content=fs.readFileSync(path.join(__dirname,"../../node_modules/jsoneditor/dist/jsoneditor.min.css"),"utf8")
content=`:root { --jsoneditoricons: url("data:image/svg+xml;base64,${encodedImageContent}"); } `+content;

let replace=[
	'url(./img/jsoneditor-icons.svg)',
	'url("./img/jsoneditor-icons.svg")',
];

for (let r of replace) {
	content=content.replaceAll(
		r,
		//'url("https://unpkg.com/jsoneditor@9.10.4/dist/img/jsoneditor-icons.svg")',
		//'url("data:image/svg+xml;base64,'+encodedImageContent+'")',
		'var(--jsoneditoricons)'
	);
}

fs.mkdirSync(path.join(__dirname,"../../tmp"),{recursive: true});
fs.writeFileSync(path.join(__dirname,"../../tmp/jsoneditor.css"),content);
