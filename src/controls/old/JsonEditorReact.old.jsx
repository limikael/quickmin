import {jsonEq} from "../utils/js-util.js";
import {jsonSchemaFix} from "../utils/json-schema-util.js";
import {useRef, useEffect, useLayoutEffect} from "react";
import JSONEditor from "jsoneditor/dist/jsoneditor-minimalist.min.js";
import JSONEDITOR_CSS from "inline:../../tmp/jsoneditor.css";

let __JSONEDITOR_CSS_ADDED=false;

function useJsonEditorCss() {
    if (!__JSONEDITOR_CSS_ADDED) {
        let styleSheet=document.createElement("style");
        styleSheet.innerText=JSONEDITOR_CSS;
        document.head.appendChild(styleSheet)

        __JSONEDITOR_CSS_ADDED=true;
    }
}

function jsonEditorIsError(jsonEditor) {
    try {
        jsonEditor.get();
        return false;
    }

    catch (e) {
        console.log("json error on set (no worries)");
        return true;
    }
}

export default function JsonEditorReact({schema, onChange, value, name, style}) {
    useJsonEditorCss();

    let containerRef=useRef();
    let editorRef=useRef();
    let unfixedRef=useRef();
    let fixedRef=useRef();

    if (!onChange)
        onChange=()=>{};

    //console.log("render unfixed "+JSON.stringify(unfixedRef.current));

    useLayoutEffect(()=>{
        //console.log("creating editor...");
        let options={
            name: name,
            search: false,
            mainMenuBar: true,
            modes: ["tree","text"],
            navigationBar: false,
            enableSort: false,
            enableTransform: false,
            history: false,
            schema: schema,
            onChange: ()=>{
                let val;
                try {
                    val=editorRef.current.get();
                }

                catch(e) {
                    console.log("json error on change (no worries)");
                    return;
                }

                unfixedRef.current=null;
                fixedRef.current=null;
                onChange(val);
            }
        };

        editorRef.current=new JSONEditor(containerRef.current,options);

        let theValue;
        if (fixedRef.current && jsonEq(fixedRef.current,value)) {
            theValue=jsonSchemaFix(schema,unfixedRef.current);
        }

        else {
            theValue=jsonSchemaFix(schema,value);
            unfixedRef.current=structuredClone(value);
        }

        fixedRef.current=structuredClone(theValue);

        editorRef.current.set(theValue);
        if (!jsonEq(theValue,value)) {
            //console.log("trigger fixed change",theValue);
            setTimeout(()=>{
                onChange(theValue);
            },0);
        }

        return ()=>{
            editorRef.current.destroy();
            editorRef.current=null;
        }
    },[JSON.stringify(schema)]);

    if (editorRef.current) {
        if (jsonEditorIsError(editorRef.current) ||
                !jsonEq(editorRef.current.get(),value)) {
            editorRef.current.set(value);
            if (fixedRef.current &&
                    !jsonEq(fixedRef.current,value)) {
                fixedRef.current=null;
                unfixedRef.current=null;
            }
        }
    }

    //console.log("set value: ",value);

    return (
        <div ref={containerRef} style={style}/>
    );
}
