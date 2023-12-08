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
import {drizzleSqliteDriver} from "../export/drizzle-sqlite.js";
import {nodeStorageDriver} from "../export/node-storage.js";
import {localNodeBundle} from "../export/local-node-bundle.js";
import {wranglerDb,wranglerDbLocal} from "../export/wrangler-db.js";
import urlJoin from 'url-join';
import {googleAuthDriver} from "../auth/google-auth.js";
import {moduleAlias} from "../utils/esbuild-util.js";
import {QuickminApi} from "quickmin-api";
import {parse as parseYaml} from "yaml";

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
    .option("driver",{
        description: "Database driver to use.",
        choices: ["drizzle","wrangler","wrangler-local"],
        default: "drizzle"
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
    .option("uidir",{
        description: "Where to build and look for quickmin-bundle.js",
        default: path.join(__dirname,"../../dist/"),
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
    .command("makeui","Create quickmin-bundle.js for local serving. Only useful if you have devDependencies.")
    .command("gc","Garbage collect uploaded content.")
    /*.command("export <filename>","Export data to file.")
    .command("import <filename>","Import data from file.")*/
    .command("pull","Pull data from remote.")
    .command("pull-content","Pull content from remote.")
    .strict()
    .usage("quickmin -- Backend as an app or middleware.")
    .epilog("For more info, see https://github.com/limikael/quickmin")

let options=yargsConf.parse();

let command=options._[0];
if (!command)
    command="serve";

async function makeUi() {
    let outfile=path.join(options.uidir,"quickmin-bundle.js");

    /*if (fs.existsSync(outfile) && !options.rebuild) {
        console.log("Using existing UI: "+outfile);
        return;
    }*/

    console.log("Creating client bundle: "+outfile);

    let esbuild=await import("esbuild");
    await esbuild.build({
        absWorkingDir: __dirname,
        entryPoints: [path.join(__dirname,"../ui/QuickminAdmin.jsx")],
        outfile: outfile,
        //sourcemap: true,
        bundle: true,
        format: "esm",
        inject: [path.join(__dirname,"../utils/preact-shim.js")],
        jsxFactory: "h",
        jsxFragment: "Fragment",
        minify: true,
        plugins: [
            moduleAlias({
                "react": "preact/compat",
                "react-dom": "preact/compat",
                "react/jsx-runtime": "preact/jsx-runtime"
            })
        ],
    });
}

if (command=="makeui") {
    await makeUi();
    process.exit();
}

if (!fs.existsSync(options.conf)) {
    console.log("Can't find config file:",options.conf);
    console.log();
    yargsConf.showHelp();
    process.exit(1);
}

let drivers=[];
let driverOptions={};

switch (options.driver) {
    case "sequelize":
        throw new Error("Not supported at the moment... Refactoring...");
        break;

    case "drizzle":
        drivers.push(drizzleSqliteDriver);
        break;

    case "wrangler":
        drivers.push(wranglerDb);
        break;

    case "wrangler-local":
        drivers.push(wranglerDbLocal);
        break;
}

if (command!="migrate") {
    switch (options.storage) {
        case "node":
            drivers.push(nodeStorageDriver);
            break;
    }
}

drivers.push(googleAuthDriver);
drivers.push(localNodeBundle);

let conf=parseYaml(fs.readFileSync(options.conf,"utf8"));
let quickmin=new QuickminServer(conf,drivers);
//let api=quickmin.api;
let remoteApi;
if (options.remote) {
    remoteApi=new QuickminApi({
        url: options.remote,
        apiKey: quickmin.conf.apiKey
    });
}

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
        await quickmin.sync({
            dryRun: options.dryRun,
            force: options.force
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

