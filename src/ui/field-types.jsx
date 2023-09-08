import {TextField, TextInput, DateField, DateInput, DateTimeInput,
        SelectField, SelectInput, ImageField, ImageInput} from "react-admin";
import {FrugalTextInput} from './FrugalTextInput.jsx';
import urlJoin from 'url-join';

function QuickminImageInput(props) {
    return (
        <ImageInput source={props.source} label={props.title}>
           <ImageField source="src" title="title" />
        </ImageInput>
    );
}

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
            if (field.choices) {
                let choices=field.choices.split(",")
                field.choices=choices.map(s=>{
                    return ({
                        id: s,
                        name: s.charAt(0).toUpperCase()+s.slice(1)
                    })
                });
            }

            else {
                field.choices=[];
                for (let child of field.children) {
                    field.choices.push({
                        id: child.attributes.id,
                        name: child.children[0]
                    })
                }
            }

            /*field.choices=[
                {id: "test1", name: "bla"},
                {id: "test2", name: "bla bla"},
            ];*/

            /*if (Array.isArray(field.choices)
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
            }*/
        }
    },

    "image": {
//        list: QuickminImageField,
        edit: QuickminImageInput,
        readProcessor(data, conf) {
            let url="";
            if (data)
                url=urlJoin(conf.apiUrl,"_content",data);

            return {
                title: 'Image',
                src: url,
                current: data
            }
        },
        writeProcessor(field) {
            if (field) {
                if (field.rawFile)
                    return field.rawFile

                else
                    return field.current;
            }

            return null;
        }
    },
};

export default FIELD_TYPES;
