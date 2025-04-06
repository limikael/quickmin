import {useRef, useLayoutEffect, useState, useMemo} from "react";
import {jsonEq, jsonClone} from "../utils/js-util.js";
import {jsonSchemaFix} from "../utils/json-schema-util.js";
import {useIsValueChangedJson} from "../utils/react-util.jsx";

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

export function FixingJsonEditor({schema, onChange, onImmediateChange, value, name, style, JSONEditor}) {
    let commitedRef=useRef();

    function handleChange(v) {
        commitedRef.current=jsonClone(v);
        v=jsonSchemaFix(schema,v);
        onChange(v);
    }

    useMemo(()=>{
        //console.log("initial",value);
        commitedRef.current=jsonClone(value);
    },[]);

    // If the schema changes, but not the value, use the committed value.
    let schemaChange=useIsValueChangedJson(schema);
    let valueChange=useIsValueChangedJson(value);
    if (schemaChange && !valueChange && commitedRef.current)
        value=commitedRef.current;

    let fixedValue=jsonSchemaFix(schema,value);
    if (!jsonEq(fixedValue,value)) {
        if (onImmediateChange)
            onImmediateChange(fixedValue);

        else
            onChange(fixedValue);
    }

    return (
        <ReactJsonEditor 
                schema={schema} 
                onChange={handleChange} 
                value={fixedValue} 
                name={name}
                style={style}
                JSONEditor={JSONEditor}/>
    );
}

export function ReactJsonEditor({schema, onChange, value, name, style, JSONEditor}) {
    let containerRef=useRef();
    let editorRef=useRef();

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
                try {
                    onChange(editorRef.current.get());
                }

                catch(e) {
                    console.log("json error on change (no worries)");
                    return;
                }

            }
        };

        editorRef.current=new JSONEditor(containerRef.current,options);
        editorRef.current.set(value);

        return ()=>{
            editorRef.current.destroy();
            editorRef.current=null;
        }
    },[JSON.stringify(schema)]);

    if (editorRef.current) {
        if (jsonEditorIsError(editorRef.current) ||
                !jsonEq(editorRef.current.get(),value))
            editorRef.current.set(value);
    }

    return (
        <div ref={containerRef} style={style}/>
    );
}
