import {TextField, TextInput, DateField, DateInput, DateTimeInput,
        SelectField, SelectInput, ImageField, ImageInput,
        ReferenceField, ReferenceInput} from "react-admin";
import {FrugalTextInput} from './FrugalTextInput.jsx';
import urlJoin from 'url-join';

function QuickminImageInput(props) {
    let sx,options;
    if (props.disabled) {
        sx={"button": {display: "none"}};
        options={disabled: true}
    }

    return (
        <ImageInput source={props.source} label={props.title}
                options={options} sx={sx}>
           <ImageField source="src" title="title"/>
        </ImageInput>
    );
}

function processSelectConf(field) {
    if (field.choices && Array.isArray(field.choices)) {
        field.choices=field.choices.map(s=>{
            return ({
                id: s,
                name: s.charAt(0).toUpperCase()+s.slice(1)
            })
        });
    }

    else if (field.choices) {
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

    "authmethod": {
        list: TextField,
        edit: TextInput,
    },

    "select": {
        list: SelectField,
        edit: SelectInput,
        confProcessor: processSelectConf
    },

    "reference": {
        list: ReferenceField,
        edit: ReferenceInput
    },

    "image": {
//        list: QuickminImageField,
        edit: QuickminImageInput,
        readProcessor(data, conf) {
            //console.log("got data: "+data);

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
