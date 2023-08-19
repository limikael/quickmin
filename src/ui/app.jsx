import {Admin, Resource, ListGuesser, EditGuesser, List, Datagrid, TextField,
        Edit, SimpleForm, TextInput, Create, DateField, DateInput, DateTimeInput,
        SelectField, SelectInput} from 'react-admin';
import {FrugalTextInput} from './FrugalTextInput.jsx';
import simpleRestProvider from 'ra-data-simple-rest';
import {useAsyncMemo} from "../utils/react-util.jsx";
import {fetchEx} from "../utils/js-util.js";

function collectionList(collection) {
    let REACT_LIST_TYPES={
        "text": TextField,
        "richtext": TextField,
        "date": DateField,
        "datetime": DateField,
        "select": SelectField
    };

    return (
        <List hasCreate={true} exporter={false}>
            <Datagrid rowClick="edit" size="medium">
                {collection.listFields.map(fid=>{
                    let f=collection.fields[fid];
                    let Comp=REACT_LIST_TYPES[f.type];
                    return (
                        <Comp source={fid} {...f}/>
                    );
                })}
            </Datagrid>
        </List>
    );
}

function collectionEditor(collection, mode) {
    let REACT_EDIT_TYPES={
        "text": TextInput,
        "richtext": FrugalTextInput,
        "date": DateInput,
        "datetime": DateTimeInput,
        "select": SelectInput
    };

    let content=(
        <SimpleForm>
            {Object.keys(collection.fields).map(fid=>{
                let f=collection.fields[fid];
                let Comp=REACT_EDIT_TYPES[f.type];
                return (
                    <Comp source={fid} key={fid} {...f}/>
                );
            })}
        </SimpleForm>
    );

    switch (mode) {
        case "edit":
            return (
                <Edit mutationMode="pessimistic">
                    {content}
                </Edit>
            );

        case "create":
            return (
                <Create redirect="list">
                    {content}
                </Create>
            );
    }
}

function collectionResource(collection) {
    return (
        <Resource
                name={collection.key}
                key={collection.key}
                list={collectionList(collection)}
                edit={collectionEditor(collection,"edit")}
                create={collectionEditor(collection,"create")}/>
    );
}

export function App() {
    let FIELD_CONF_PROCESSORS={
        select(field) {
            if ((typeof field.choices)=="object") {
                let choices=field.choices;
                field.choices=[];
                for (let k in choices)
                    field.choices.push({
                        id: k,
                        name: choices[k]
                    });
            }

            else if ((typeof field.choices[0])=="string") {
                field.choices=field.choices.map(s=>{
                    return ({
                        id: s,
                        name: s.charAt(0).toUpperCase()+s.slice(1)
                    })
                });
            }
        }
    }

    let schema=useAsyncMemo(async()=>{
        let response=await fetchEx("http://localhost:3000/_schema",{
            dataType: "json"
        });

        for (let cid in response.data.collections) {
            for (let fid in response.data.collections[cid].fields) {
                let type=response.data.collections[cid].fields[fid].type;
                let p=FIELD_CONF_PROCESSORS[type];
                if (p) 
                    p(response.data.collections[cid].fields[fid]);
            }
        }

        return response.data;
    },[]);

    if (!schema)
        return "Loading...";

    //console.log("render...");

    let dataProvider=simpleRestProvider('http://localhost:3000');

    return (
        <Admin dataProvider={dataProvider}>
            {Object.keys(schema.collections).map(c=>
                collectionResource({key: c,...schema.collections[c]})
            )}
        </Admin>
    );
}
