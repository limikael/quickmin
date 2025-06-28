#!/usr/bin/env node

import {moduleAlias} from "../utils/esbuild-util.js";
import inlineImportPlugin from "esbuild-plugin-inline-import";
import esbuild from "esbuild";
import path from "path";

let outfile=path.join("dist","quickmin-bundle.js");
console.log("Creating client bundle: "+outfile);

await esbuild.build({
    absWorkingDir: process.cwd(),
    entryPoints: ["src/ui/QuickminAdmin.jsx"],
    outfile: outfile,
    //sourcemap: true,
    bundle: true,
    format: "esm",
    inject: ["src/utils/preact-shim.js"],
    jsxFactory: "h",
    jsxFragment: "Fragment",
    minify: true, //options.minify,
    plugins: [
        moduleAlias({
            "react": "preact/compat",
            "react-dom": "preact/compat",
            "react/jsx-runtime": "preact/jsx-runtime"
        }),
        inlineImportPlugin()
    ],
});
