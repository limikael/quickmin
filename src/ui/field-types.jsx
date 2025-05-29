import {TextField, TextInput, DateField, DateInput, DateTimeInput,
        SelectField, SelectInput, ImageField, ImageInput,
        ReferenceField, ReferenceInput,
        NumberField, NumberInput, ReferenceManyField, Datagrid, Labeled,
        Button, useRecordContext, useResourceContext, FieldTitle,
        BooleanField, BooleanInput, FileInput, FileField} from "react-admin";
import {FrugalTextInput} from './FrugalTextInput.jsx';
import urlJoin from 'url-join';
import {searchParamsFromObject, makeNameFromSymbol} from "../utils/js-util.js";
import ContentAdd from '@mui/icons-material/esm/Add';
import {Link, useNavigate} from 'react-router-dom';
import {useRef, useEffect, useLayoutEffect} from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import {JsonInput} from "../controls/json-control.jsx";
import {QuickminSelectField, QuickminSelectInput} from "../controls/select-control.jsx";
import {TextOption} from "../controls/text-control.jsx";
import {NumberOption} from "../controls/number-control.jsx";
import {DateOption} from "../controls/date-control.jsx";
import {FileOption} from "../controls/file-control.jsx";
import {SelectOption} from "../controls/select-control.jsx";

dayjs.extend(utc);
dayjs.extend(relativeTime);

function QuickminFileInput(props) {
    return (
        <FileInput source={props.source} label={props.title}>
            <FileField source="src" title="title"/>
        </FileInput>
    );
}

function QuickminFileField({source, ...props}) {
    let record=useRecordContext();
    if (!record || !record[source] || !record[source].src)
        return;

    return (<a href={record[source].src}>{record[source].title}</a>);
}

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

function QuickminImageField({source, ...props}) {
    let record=useRecordContext();
    if (!record || !record[source] || !record[source].src)
        return;

    let style={
        height: "2em",
        width: "2em",
        marginTop: "-0.5em",
        marginBottom: "-0.5em",
        objectFit: "contain",
    };

    return (
        <img src={record[source].src} style={style}/>
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
        filter: TextInput,
        option: TextOption
    },

    "json": {
        list: TextField,
        edit: JsonInput,
    },

    "integer": {
        list: NumberField,
        edit: NumberInput,
        option: NumberOption
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
        option: DateOption,
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
        list: QuickminSelectField,
        edit: QuickminSelectInput,
        filter: QuickminSelectInput,
        option: SelectOption,
        //confProcessor: processSelectConf
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
        list: QuickminImageField,
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

    "file": {
        list: QuickminFileField,
        edit: QuickminFileInput,
        option: FileOption,
        readProcessor(data, conf) {
            if (!data)
                return;

            let url=urlJoin(conf.apiUrl,"_content",data);
            return {
                title: 'File',
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
    }
};

export default FIELD_TYPES;
