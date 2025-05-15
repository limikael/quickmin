import {SelectInput, SelectField} from "react-admin";
import {useDepRecord} from "../utils/ra-util.jsx";
import {useAsyncMemo} from "../utils/react-util.jsx";

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
        choices=[];
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