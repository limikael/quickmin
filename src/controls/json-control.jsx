import {Typography } from '@mui/material';
import {makeNameFromSymbol} from "../utils/js-util.js";
import JsonEditorReact from "./JsonEditorReact.jsx";
import {quickminGetClientMethod} from "../server/quickmin-conf-util.js";
import {useInput} from "react-admin";
import {useWatch} from 'react-hook-form';

function useJsonInputSchema({schema, schema_cb, conf, record}) {
    if (schema_cb) {
        let method=quickminGetClientMethod(conf,schema_cb);
        if (!method)
            throw new Error("Undefined client method: "+props.schema_cb);

        schema=method({item: record});
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
    let input=useInput({source: props.source});
    //console.log("input",input);

    let schema=useJsonInputSchema({
        schema: props.schema, 
        schema_cb: props.schema_cb, 
        conf: props.conf, 
        record
    });

    // I want {} to be the default, it was before, not 100% sure why needed.
    let value=input.field.value;
    if (value==="")
    	value={};

	function handleChange(v) {
        input.field.onChange(v);
	}

    return (<>
        <Typography color="text.secondary" sx={{fontSize: "12px"}}>
            {makeNameFromSymbol(props.id)}
        </Typography>
        <JsonEditorReact 
                style="width: 100%; margin-bottom: 12px"
        		name={props.id}
	        	value={value}
                schema={schema}
	        	onChange={handleChange}/>
    </>);
}