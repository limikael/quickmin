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
import {wranglerDb,wranglerDbLocal} from "../export/wrangler-db.js";
import isoqBundler from "isoq/bundler";
import urlJoin from 'url-join';
import {googleAuthDriver} from "../auth/google-auth.js";
import {moduleAlias} from "isoq/esbuild-util";

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
        choices: ["sequelize","drizzle","wrangler","wrangler-local"],
        default: "drizzle"
    })
    .option("storage",{
        description: "Storage driver to use.",
        choices: ["node"],
        default: "node"
    })
    .option("dry-run",{
        description: "Show SQL queries that would be performed by migration. "
            +"No schema modifications made.",
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
    .option("rebuild",{
        description: "Rebuild UI files even if they exist.",
        type: "boolean"
    })
    .command("serve","Serve restful api and UI (default).")
    .command("migrate","Perform database migration.")
    .command("makeui","Create quickmin-bundle.js for local serving.")
    .strict()
    .usage("quickmin -- Backend as an app or middleware.")
    .epilog("For more info, see https://github.com/limikael/quickmin")

let options=yargsConf.parse();

let command=options._[0];
if (!command)
    command="serve";

async function makeUi() {
    let outfile=path.join(options.uidir,"quickmin-bundle.js");

    if (fs.existsSync(outfile) && !options.rebuild) {
        console.log("Using existing UI: "+outfile);
        return;
    }

    console.log("Creating client bundle: "+outfile);

    let esbuild=await import("esbuild");
    await esbuild.build({
        entryPoints: [path.join(__dirname,"../ui/QuickminAdmin.jsx")],
        outfile: outfile,
        bundle: true,
        format: "esm",
        inject: ["isoq/preact-shim"],
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

switch (options.storage) {
    case "node":
        drivers.push(nodeStorageDriver);
        break;
}

drivers.push(googleAuthDriver);

let confYaml=fs.readFileSync(options.conf,"utf8");
let quickmin=new QuickminServer(confYaml,drivers);

switch (command) {
    case "serve":
        await makeUi();

        let app=new Hono();
        app.use("*",async (c, next)=>{
            res=await quickmin.handleRequest(c.req.raw);

            if (res)
                return res;

            return await next();
        });

        let p=path.join(__dirname,"../../dist/");
        app.use("*", serveStatic({root: path.relative("",p)}))

        let res=serve({
            fetch: app.fetch,
            port: options.port
        },(info)=>{
            let base=`http://localhost:${info.port}`
            if (options.ui) {
                console.log("UI available at:");
                console.log(`  ${urlJoin(base,quickmin.conf.apiPath)}/`);
                console.log();
            }
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
}

