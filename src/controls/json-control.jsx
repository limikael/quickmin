import {Typography } from '@mui/material';
import {makeNameFromSymbol} from "../utils/js-util.js";
import {FixingJsonEditor} from "./ReactJsonEditor.jsx";
import {quickminGetClientMethod} from "../server/quickmin-conf-util.js";
import {useInput} from "react-admin";
import {useWatch} from 'react-hook-form';
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

// ["hello"] => a record with hello
// [] => an empty record
// undefined => the whole record
function useDepRecord(deps) {
    let watchParams;
    if (Array.isArray(deps))
        watchParams={name: deps};

    let record=useWatch(watchParams);
    if (Array.isArray(deps)) {
        record=Object.fromEntries(
            [...Array(deps.length).keys()].map(i=>[deps[i],record[i]])
        )
    }

    return record;
}

function useJsonInputSchema(props) {
    let dep=[];
    if (props.schema_cb) {
        if (props.dep)
            dep=props.dep.split(",").map(s=>s.trim());

        else
            dep=undefined;
    }

    let depRecord=useDepRecord(dep);

    let schema=props.schema;
    if (props.schema_cb) {
        let method=quickminGetClientMethod(props.conf,props.schema_cb);
        if (!method)
            throw new Error("Undefined client method: "+props.schema_cb);

        schema=method({item: depRecord});
    }

    if (typeof schema=="string")
        schema=JSON.parse(schema);

    return schema;
}

export function JsonInput(props) {
    useJsonEditorCss();

    let input=useInput({source: props.source});
    let schema=useJsonInputSchema(props);

	function handleChange(v) {
        input.field.onChange(v);
	}

    function handleImmediateChange(v) {
        setTimeout(()=>{
            input.field.onChange(v);
        },0);
    }

    return (<>
        <Typography color="text.secondary" sx={{fontSize: "12px"}}>
            {makeNameFromSymbol(props.id)}
        </Typography>
        <FixingJsonEditor 
                style="width: 100%; margin-bottom: 12px"
        		name={props.id}
	        	value={input.field.value}
                schema={schema}
	        	onChange={handleChange}
                onImmediateChange={handleImmediateChange}
                JSONEditor={JSONEditor}/>
    </>);
}