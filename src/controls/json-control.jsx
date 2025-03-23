import JSONEDITOR_CSS from "inline:../../tmp/jsoneditor.css";
import JsonEditor from "jsoneditor/dist/jsoneditor-minimalist.min.js";
import {useWatch} from 'react-hook-form';
import {useRef, useEffect, useLayoutEffect} from "react";
import {Typography } from '@mui/material';
import {useInput} from "react-admin";
import {searchParamsFromObject, makeNameFromSymbol} from "../utils/js-util.js";
import {quickminGetClientMethod} from "../server/quickmin-conf-util.js";
import {jsonSchemaCreateDefault} from "../utils/json-schema-util.js";

let __JSONEDITOR_CSS_ADDED=false;

function useJsonEditorCss() {
    if (!__JSONEDITOR_CSS_ADDED) {
        let styleSheet=document.createElement("style");
        styleSheet.innerText=JSONEDITOR_CSS;
        document.head.appendChild(styleSheet)

        __JSONEDITOR_CSS_ADDED=true;
    }
}

function useJsonInputSchema({schema, schema_cb, conf, record}) {
    if (schema_cb) {
        let method=quickminGetClientMethod(conf,schema_cb);
        if (!method)
            throw new Error("Undefined client method: "+props.schema_cb);

        schema=method();
    }

    if (typeof schema=="string")
        schema=JSON.parse(schema);

    return schema;
}

export function JsonInput(props) {
    let watchParams={name: []};
    if (props.schema_cb)
        watchParams=undefined;

    let record=useWatch(watchParams);
    //let watch=useWatch();
    //console.log("render json input...",watch);

    useJsonEditorCss();
    let containerRef=useRef();
    let editorRef=useRef();
    let input=useInput({source: props.source});
    let schema=useJsonInputSchema({schema: props.schema, schema_cb: props.schema_cb, conf: props.conf, record});
    console.log("render json input",record);

    useLayoutEffect(()=>{
        if (!editorRef.current) {
            //console.log("create json editor");
            let modes=["tree","text"];
            if (props.disabled)
                modes=["view"];

            let options={
                name: props.id,
                search: false,
                mainMenuBar: true,
                modes: modes,
                navigationBar: false,
                enableSort: false,
                enableTransform: false,
                history: false,
                schema: schema,
                allowSchemaSuggestions: true,
                onValidate(data) {
                    return null;
                },
                onChangeJSON(json) {
                    console.log("change...",json);
                    input.field.onChange(json);
                },
                onChangeText(s) {
                    try {
                        let json=JSON.parse(s);
                        input.field.onChange(json);
                    }

                    catch (e) {
                        console.log("unable to parse json, but that's ok...");
                    }
                }
            };

            let val=input.field.value;
            if (schema)
                val={...jsonSchemaCreateDefault(schema),...val}

            //console.log(val);

            let jsoneditor=new JsonEditor(
                containerRef.current,
                options,
                val
            );

            editorRef.current=jsoneditor;
        }
    });

    return (<>
        <Typography color="text.secondary" sx={{fontSize: "12px"}}>
            {makeNameFromSymbol(props.id)}
        </Typography>
        <div ref={containerRef} style="width: 100%; margin-bottom: 12px"/>
    </>);
}
