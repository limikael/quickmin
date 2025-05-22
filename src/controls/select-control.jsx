import {SelectInput, SelectField} from "react-admin";
import {useDepRecord} from "../utils/ra-util.jsx";
import {useAsyncMemo} from "../utils/react-util.jsx";
import MuiSelect from "@mui/material/Select";
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import {useId} from "react";
import {makeNameFromSymbol} from "../utils/js-util.js";

function parseSelectChoices(field) {
    if (field.choices && Array.isArray(field.choices)) {
        return field.choices.map(s=>{
            return ({
                id: s,
                name: s.charAt(0).toUpperCase()+s.slice(1)
            })
        });
    }

    else if (field.choices) {
        let choices=field.choices.split(",")
        return choices.map(s=>{
            return ({
                id: s,
                name: s.charAt(0).toUpperCase()+s.slice(1)
            })
        });
    }

    else {
        let choices=[];
        for (let child of field.children) {
            choices.push({
                id: child.attributes.id,
                name: child.children[0]
            })
        }

        return choices;
    }
}

function SelectInputCb(props) {
	let record=useDepRecord({dep: props.dep});
	let method=props.conf.getClientMethod(props.choices_cb);
	let choices=useAsyncMemo(
        ()=>method({item: record, ...props.conf.getCallbackParams()}),
        JSON.stringify(record)
    );

    if (choices===undefined)
        props={...props,choices: [],disabled: true};

    else
    	props={...props,choices};

	return (<SelectInput {...props}/>);
}

export function QuickminSelectInput(props) {
	if (props.purpose=="filter" && props.choices_cb)
		throw new Error("Can't filter on a select with callback");

	if (props.choices_cb)
		return (<SelectInputCb {...props}/>);

	props={...props, choices: parseSelectChoices(props)};
	return (<SelectInput {...props}/>);
}

export function QuickminSelectField(props) {
	if (props.choices_cb)
		throw new Error("Can't list a select with callback");

	props={...props, choices: parseSelectChoices(props)};
	return (<SelectField {...props}/>);
}

export function SelectOption({label, value, onChange, choices}) {
    label=makeNameFromSymbol(label);

    let id=useId();
    let labelId="options-select-"+id;

    if (!value)
        value="";

    let optionArray=parseSelectChoices({choices});

    return (
        <FormControl fullWidth margin="dense">
            <InputLabel id={labelId}>{label}</InputLabel>
            <MuiSelect
                    fullWidth
                    label={label}
                    labelId={labelId}
                    value={value}
                    onChange={onChange}>
                <MenuItem value=""></MenuItem>
                {optionArray.map(o=>
                    <MenuItem value={o.id}>{o.name}</MenuItem>
                )}
            </MuiSelect>
        </FormControl>
    );
}