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
import {nodeStorageDriver} from "../storage/node-storage.js";
import {localNodeBundle} from "../export/local-node-bundle.js";
import urlJoin from 'url-join';
import {googleAuthDriver} from "../auth/google-auth.js";
import {QuickminApi} from "quickmin-api";
import {parse as parseYaml} from "yaml";
import {DeclaredError} from "../utils/js-util.js";
import {checkDeclaredError} from "../utils/node-util.js";
import QUICKMIN_YAML_TEMPLATE from "./quickmin-yaml-template.js";
import {dsnDb} from "../db/dsn-db.js";
import {wranglerDbLocal, wranglerDbRemote} from "../db/wrangler-db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let pkg=JSON.parse(fs.readFileSync(path.join(__dirname,"../../package.json")));

let yargsConf=yargs(hideBin(process.argv))
    .version("version","Show version.",pkg.version)
    .option("port",{
        type: "number",
        default: 3000,
        description: "Port to listen to.",
    })
    .option("conf",{
        default: "quickmin.yaml",
        description: "Config file.",
    })
    .option("driver",{
        description: "Database driver to use.",
        choices: ["dsn","wrangler-local","wrangler-remote"],
        default: "dsn"
    })
    .option("storage",{
        description: "Storage driver to use.",
        choices: ["node"],
        default: "node"
    })
    .option("dry-run",{
        description: "Show SQL queries that would be performed by migration, "+
            "or report files that would be deleted. "+
            "No schema modifications made or files affected.",
        type: "boolean"
    })
    .option("force",{
        description: "Recreate tables and copy data, even if the schema seems up do date. "
            +"Needed in order to apply foreign key constraints on an existing schema.",
        type: "boolean"
    })
    .option("risky",{
        description: "Perform migration even if it might result in data loss, "
            +"i.e. if existing columns in the database would be removed.",
        type: "boolean"
    })
    .option("test",{
        description: "Test migrating data to new tables, and then remove the new tables. "
            +"The existing data will be intact, but might leave garbage tables that needs deletion. ",
        type: "boolean"
    })
    .option("uidir",{
        description: "Where to build and look for quickmin-bundle.js",
        default: path.join(__dirname,"../../dist/"),
    })
    .option("minify",{
        description: "Minify when building ui",
        type: "boolean",
        default: true
    })
    /*.option("rebuild",{
        description: "Rebuild UI files even if they exist.",
        type: "boolean"
    })*/
    .option("remote",{
        description: "URL for performing operations on remote instance.",
    })
    .option("tables",{
        description: "Comma separated list of tables, for import and export commands."
    })
    .command("serve","Serve restful api and UI (default).")
    .command("migrate","Perform database migration.")
    .command("init","Create initial quickmin.yaml")
    .command("makeui","Create quickmin-bundle.js for local serving. Only useful if you have devDependencies.")
    .command("gc","Garbage collect uploaded content.")
    /*.command("export <filename>","Export data to file.")
    .command("import <filename>","Import data from file.")*/
    .command("pull","Pull data from remote.")
    .command("push","Push data to remote.")
    .command("pull-content","Pull content from remote.")
    .strict()
    .usage("quickmin -- Backend as an app or middleware.")
    .epilog("For more info, see https://github.com/limikael/quickmin")

let options=yargsConf.parse();

let command=options._[0];
if (!command)
    command="serve";

await checkDeclaredError(async ()=>{
    switch (command) {
        case "init":
            if (fs.existsSync(options.conf))
                throw new DeclaredError("Already exists: "+options.conf);

            let template=QUICKMIN_YAML_TEMPLATE;
            let secretBytes=new Uint8Array(16);
            crypto.getRandomValues(secretBytes);
            let secret=Array
                .from(secretBytes)
                .map(c=>c.toString(16).padStart(2,"0")).join("");
            template=template.replaceAll("$$JWT_SECRET$$",secret);
            fs.writeFileSync(options.conf,template);
            console.log("Created: "+options.conf);
            command="migrate";
            break;
    }
});

if (!fs.existsSync(options.conf)) {
    console.log("Can't find config file:",options.conf);
    console.log();
    yargsConf.showHelp();
    process.exit(1);
}

let drivers=[];
switch (options.driver) {
    case "dsn":
        drivers.push(dsnDb);
        break;

    case "wrangler-remote":
        drivers.push(wranglerDbRemote);
        break;

    case "wrangler-local":
        drivers.push(wranglerDbLocal);
        break;
}

switch (options.storage) {
    case "node":
        drivers.push(nodeStorageDriver);
        break;
}

drivers.push(googleAuthDriver);
drivers.push(localNodeBundle);

let quickmin;
let remoteApi;
await checkDeclaredError(async ()=>{
    let conf=parseYaml(fs.readFileSync(options.conf,"utf8"));
    if (conf.static) {
        conf.fs=fs;
    }
    quickmin=new QuickminServer(conf,drivers);
    if (options.remote) {
        remoteApi=new QuickminApi({
            url: options.remote,
            apiKey: quickmin.conf.apiKey
        });
    }
});

switch (command) {
    case "serve":
        let app=new Hono();
        app.use("*",async (c, next)=>{
            res=await quickmin.handleRequest(c.req.raw);

            if (res)
                return res;

            return await next();
        });

        //app.use("*", serveStatic({root: path.relative("",options.uidir)}));

        let res=serve({
            fetch: app.fetch,
            port: options.port
        },(info)=>{
            let base=`http://localhost:${info.port}`
            console.log("UI available at:");
            console.log(`  ${urlJoin(base,quickmin.conf.apiPath)}/`);
            console.log();
            console.log("REST endpoints at:");
            for (let k in quickmin.collections)
                console.log(`  ${urlJoin(base,quickmin.conf.apiPath,k)}`);
        });
        break;

    case "migrate":
        //console.log("migrate...");
        await quickmin.sync({
            dryRun: options.dryRun,
            force: options.force,
            test: options.test,
            risky: options.risky
        });
        break;

    /*case "export":
        if (!options.tables) {
            console.log("Need tables option.")
            process.exit();
        }

        let tables=options.tables.split(",");
        console.log("Exporting to: "+options.filename+", tables: "+tables.join(tables));

        let data={};
        for (let table of tables)
            data[table]=await api.findMany(table);

        fs.writeFileSync(options.filename,JSON.stringify(data,null,2));
        break;

    case "import":
        console.log("Importing data from: "+options.filename);

        let tableData=JSON.parse(fs.readFileSync(options.filename,"utf8"));
        for (let table in tableData) {
            console.log("Importing table: "+table);
            let datas=tableData[table]
            for (let data of datas)
                await api.insert(table,data);
        }
        break;*/

    case "pull":
        if (!options.tables) {
            console.log("Need tables option.")
            process.exit();
        }

        for (let table of options.tables.split(",")) {
            console.log("Clearing current data in: "+table);
            for (let existing of await quickmin.api.findMany(table))
                await quickmin.api.delete(table,existing.id);

            console.log("Pulling table: "+table);
            let tableDatas=await remoteApi.findMany(table);
            let i=0;
            for (let data of tableDatas) {
                process.stdout.write((i++)+"/"+tableDatas.length+"\r");
                await quickmin.api.insert(table,data);
            }
            console.log("Done.                     ");
        }
        break;

    case "push":
        if (!options.tables) {
            console.log("Need tables option.")
            process.exit();
        }

        for (let table of options.tables.split(",")) {
            console.log("Clearing current data in: "+table);
            for (let existing of await remoteApi.findMany(table))
                await remoteApi.delete(table,existing.id);

            console.log("Pushing table: "+table);
            let tableDatas=await quickmin.api.findMany(table);
            let i=0;
            for (let data of tableDatas) {
                process.stdout.write((i++)+"/"+tableDatas.length+"\r");
                await remoteApi.insert(table,data);
            }
            console.log("Done.                     ");
        }
        break;

    case "pull-content":
        await (async ()=>{
            let contentFiles=await quickmin.getMissingContentFiles();
            let i=0;
            for (let fn of contentFiles) {
                process.stdout.write((++i)+"/"+contentFiles.length+"\r");

                let contentUrl=urlJoin(options.remote,"_content",fn);
                let response=await fetch(contentUrl);
                if (response.status==200) {
                    let body=await response.blob();
                    await quickmin.storage.putFile(fn,body);
                }

                else {
                    console.log("error on: "+contentUrl);
                    console.log("status: "+response.status);
                }
            }
            console.log();
            console.log("Done.");
        })();
        break;

    case "gc":
        let result;
        if (options.remote) {
            let u=new URL(urlJoin(options.remote,"_gc"));

            if (options.dryRun)
                u.searchParams.set("dryRun",options.dryRun);

            let headers=new Headers();
            if (quickmin.conf.apiKey)
                headers.set("x-api-key",quickmin.conf.apiKey);

            let response=await fetch(u.toString(),{
                method: "POST",
                headers: headers
            });

            if (response.status!=200) {
                console.log(response.status,await response.text());
                process.exit(1);
            }

            result=await response.json();
        }

        else {
            result=await quickmin.garbageCollect({
                dryRun: options.dryRun
            });
        }

        console.log(JSON.stringify(result,null,2));
        break;
}
