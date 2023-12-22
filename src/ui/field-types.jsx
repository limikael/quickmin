import {TextField, TextInput, DateField, DateInput, DateTimeInput,
        SelectField, SelectInput, ImageField, ImageInput,
        ReferenceField, ReferenceInput,
        NumberField, NumberInput, ReferenceManyField, Datagrid, Labeled,
        Button, useRecordContext, useResourceContext, FieldTitle, useInput,
        BooleanField, BooleanInput} from "react-admin";
import {FrugalTextInput} from './FrugalTextInput.jsx';
import urlJoin from 'url-join';
import {searchParamsFromObject, makeNameFromSymbol} from "../utils/js-util.js";
import ContentAdd from '@mui/icons-material/esm/Add';
import {Link, useNavigate} from 'react-router-dom';
import JsonEditor from "jsoneditor/dist/jsoneditor-minimalist.min.js";
import {useRef, useEffect, useLayoutEffect} from "react";
import {Typography } from '@mui/material';
//import JSONEDITOR_CSS from "inline:../../node_modules/jsoneditor/dist/jsoneditor.min.css";
import JSONEDITOR_CSS from "inline:../../tmp/jsoneditor.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(utc);
dayjs.extend(relativeTime);

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

let __JSONEDITOR_CSS_ADDED=false;

function JsonInput(props) {
    if (!__JSONEDITOR_CSS_ADDED) {
        let styleSheet=document.createElement("style");
        styleSheet.innerText=JSONEDITOR_CSS;
        document.head.appendChild(styleSheet)

        __JSONEDITOR_CSS_ADDED=true;
    }

    let containerRef=useRef();
    let editorRef=useRef();
    let input=useInput({source: props.source})

    useLayoutEffect(()=>{
        if (!editorRef.current) {
            console.log("create json editor");
            let modes=["tree","text"];
            if (props.disabled)
                modes=["view"];

            let options={
                name: props.id,
                search: false,
                mainMenuBar: true,
                modes: modes,
                navigationBar: false,
                enableSort: false,
                enableTransform: false,
                history: false,
                onChangeJSON(json) {
                    console.log("change...");
                    input.field.onChange(json);
                },
                onChangeText(s) {
                    try {
                        let json=JSON.parse(s);
                        input.field.onChange(json);
                    }

                    catch (e) {
                        console.log("unable to parse json, but that's ok...");
                    }
                }
            };

            let jsoneditor=new JsonEditor(
                containerRef.current,
                options,
                input.field.value
            );

            editorRef.current=jsoneditor;
        }
    });

    return (<>
        <Typography color="text.secondary" sx={{fontSize: "12px"}}>
            {makeNameFromSymbol(props.id)}
        </Typography>
        <div ref={containerRef} style="width: 100%; margin-bottom: 12px"/>
    </>);
}

import DoneIcon from '@mui/icons-material/esm/Done';
//import FormatUnderlined from '@mui/icons-material/esm/FormatUnderlined';

function QuickminBooleanField(props) {
    const record=useRecordContext(props);

    if (record[props.source])
        return <DoneIcon fontSize="inherit"/>;
}

function QuickminDateTimeField(props) {
    const record=useRecordContext(props);

    let v=record[props.source];
    if (!v)
        return;

    return dayjs(v).fromNow();
}

export const FIELD_TYPES={
    "text": {
        list: TextField,
        edit: TextInput,
        filter: TextInput
    },

    "json": {
        list: TextField,
        edit: JsonInput,
    },

    "integer": {
        list: NumberField,
        edit: NumberInput,
    },

    "real": {
        list: NumberField,
        edit: NumberInput,
    },

    "boolean": {
        list: QuickminBooleanField,
        edit: BooleanInput,
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
        list: QuickminDateTimeField,
        edit: DateTimeInput,
        readProcessor(v) {
            if (!v)
                return v;

            return dayjs.utc(v).toDate();
        },
        writeProcessor(v) {
            if (!v)
                return;

            return dayjs(v).utc().format("YYYY-MM-DD HH:mm:ss");
        }
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
