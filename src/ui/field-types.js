import {TextField, TextInput, DateField, DateInput, DateTimeInput,
        SelectField, SelectInput} from "react-admin";
import {FrugalTextInput} from './FrugalTextInput.jsx';

export const FIELD_TYPES={
    "text": {
        list: TextField,
        edit: TextInput,
    },

    "richtext": {
        list: TextField,
        edit: FrugalTextInput,
    },

    "date": {
        list: DateField,
        edit: DateInput,
    },

    "datetime": {
        list: DateField,
        edit: DateTimeInput,
    },

    "select": {
        list: SelectField,
        edit: SelectInput,
        confProcessor(field) {
            if (Array.isArray(field.choices)
                    && (typeof field.choices[0])=="string") {
                field.choices=field.choices.map(s=>{
                    return ({
                        id: s,
                        name: s.charAt(0).toUpperCase()+s.slice(1)
                    })
                });
            }

            else if ((typeof field.choices)=="object") {
                let choices=field.choices;
                field.choices=[];
                for (let k in choices)
                    field.choices.push({
                        id: k,
                        name: choices[k]
                    });
            }
        }
    }
};

export default FIELD_TYPES;
