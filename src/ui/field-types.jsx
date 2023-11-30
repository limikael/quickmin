import {TextField, TextInput, DateField, DateInput, DateTimeInput,
        SelectField, SelectInput, ImageField, ImageInput,
        ReferenceField, ReferenceInput,
        NumberField, NumberInput, ReferenceManyField, Datagrid, Labeled,
        Button, useRecordContext} from "react-admin";
import {FrugalTextInput} from './FrugalTextInput.jsx';
import urlJoin from 'url-join';
import {searchParamsFromObject, makeNameFromSymbol} from "../utils/js-util.js";
import ContentAdd from '@mui/icons-material/esm/Add';
import {Link, useNavigate} from 'react-router-dom';

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

function QuickminReferenceManyInput(props) {
    let {conf, label, reference, collection}=props;
    let navigate=useNavigate();
    let record=useRecordContext();

    let referenceCollection=conf.collections[reference];
    let listFields=[...referenceCollection.listFields];
    let index=listFields.indexOf(props.target);
    if (index>=0)
        listFields.splice(index,1);

    let o={}, params;
    if (record) {
        o[props.target]=record.id;
        params=searchParamsFromObject({
            source: JSON.stringify(o),
            redirect: `${collection.id}/${record.id}`
        });
    }

    function rowClick(id, resource, listRecord) {
        return `/${referenceCollection.id}/${id}?redirect=${collection.id}/${record.id}`;
    }

    return (<>
        <Labeled label={makeNameFromSymbol(props.id)} sx={{width: "100%"}}>
            <ReferenceManyField {...props} source="id">
                <Datagrid rowClick={rowClick} fullWidth={true} sx={{width: "100%"}}>
                    {listFields.map(fid=>{
                        let f=referenceCollection.fields[fid];
                        let Comp=FIELD_TYPES[f.type].list;
                        return (
                            <Comp source={fid} {...f}/>
                        );
                    })}
                </Datagrid>
            </ReferenceManyField>
        </Labeled>
        {record &&
            <Button href={`#/${referenceCollection.id}/create?${params.toString()}`}>
                <ContentAdd /> Add
            </Button>
        }
    </>);
}

export const FIELD_TYPES={
    "text": {
        list: TextField,
        edit: TextInput,
        filter: TextInput
    },

    "json": {
        list: TextField,
        edit: TextInput,
        confProcessor(field) {
            field.multiline=true;
            field.fullWidth=true;
            /*
            Should be monospace!!! For later...

            field.style={
                "font-family": "monospace !important"
            };
            field.sx={
                bgcolor: '#ff0000',
                "font-family": "monospace !important"
            };*/
        },
        readProcessor(data) {
            return JSON.stringify(data,null,2)
        },
        writeProcessor(data) {
            if (data)
                return JSON.parse(data);
        },
    },

    "integer": {
        list: NumberField,
        edit: NumberInput,
    },

    "real": {
        list: NumberField,
        edit: NumberInput,
    },

    "richtext": {
        list: TextField,
        edit: FrugalTextInput,
        confProcessor(field, conf) {
            //console.log("setting: ",conf.httpClient);
            field.apiPath=conf.apiUrl;
            field.httpClient=conf.httpClient;
            return field;
        }
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
        filter: SelectInput,
        confProcessor: processSelectConf
    },

    "reference": {
        list: ReferenceField,
        edit: ReferenceInput,
        filter: ReferenceInput,
    },

    "referencemany": {
        edit: QuickminReferenceManyInput,
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
        },
    },
};

export default FIELD_TYPES;
