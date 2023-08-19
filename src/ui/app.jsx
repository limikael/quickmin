import {Admin, Resource, List, Datagrid, 
        Edit, SimpleForm, Create, } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import {useAsyncMemo} from "../utils/react-util.jsx";
import {fetchEx} from "../utils/js-util.js";
import FIELD_TYPES from "./field-types.js";

function collectionList(collection) {
    return (
        <List hasCreate={true} exporter={false}>
            <Datagrid rowClick="edit" size="medium">
                {collection.listFields.map(fid=>{
                    let f=collection.fields[fid];
                    let Comp=FIELD_TYPES[f.type].list;
                    return (
                        <Comp source={fid} {...f}/>
                    );
                })}
            </Datagrid>
        </List>
    );
}

function collectionEditor(collection, mode) {
    let content=(
        <SimpleForm>
            {Object.keys(collection.fields).map(fid=>{
                let f=collection.fields[fid];
                let Comp=FIELD_TYPES[f.type].edit;
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

async function fetchSchema(url) {
    let response=await fetchEx("http://localhost:3000/_schema",{
        dataType: "json"
    });

    let schema=response.data;
    for (let cid in schema.collections) {
        for (let fid in schema.collections[cid].fields) {
            let type=schema.collections[cid].fields[fid].type;
            let processor=FIELD_TYPES[type].confProcessor;
            if (processor) 
                processor(schema.collections[cid].fields[fid]);
        }
    }

    return schema;
}

export function App() {
    let schema=useAsyncMemo(async()=>{
        return await fetchSchema("http://localhost:3000/_schema")
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
