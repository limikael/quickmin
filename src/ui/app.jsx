import {Admin, Resource, ListGuesser, EditGuesser, List, Datagrid, TextField,
        Edit, SimpleForm, TextInput, Create} from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';
import {useAsyncMemo} from "../utils/react-util.jsx";
import {fetchEx} from "../utils/js-util.js";

function createListComponent(collection) {
    return (
        <List hasCreate={true} exporter={false}>
            <Datagrid rowClick="edit" size="medium">
                {Object.keys(collection.fields).map(fid=>{
                    let f=collection.fields[fid];
                    switch (f.type) {
                        default:
                            return (
                                <TextField source={fid} />
                            )
                    }
                })}
            </Datagrid>
        </List>
    );
}

function createEditComponent(collection) {
    return (
        <Edit mutationMode="pessimistic">
            <SimpleForm>
                {Object.keys(collection.fields).map(fid=>{
                    let f=collection.fields[fid];
                    switch (f.type) {
                        default:
                            return (
                                <TextInput source={fid} />
                            )
                    }
                })}
            </SimpleForm>
        </Edit>
    );
}

function createCreateComponent(collection) {
    return (
        <Create redirect="list">
            <SimpleForm>
                {Object.keys(collection.fields).map(fid=>{
                    let f=collection.fields[fid];
                    switch (f.type) {
                        default:
                            return (
                                <TextInput source={fid} />
                            )
                    }
                })}
            </SimpleForm>
        </Create>
    );
}

function createCollectionComponents(cid, collection) {
    return {
        list: createListComponent(collection),
        edit: createEditComponent(collection),
        create: createCreateComponent(collection)
    }
}

export function App() {
    let schema=useAsyncMemo(async()=>{
        let response=await fetchEx("http://localhost:3000/_schema",{
            dataType: "json"
        });

        return response.data;
    },[]);

    if (!schema)
        return "Loading...";

    //console.log(schema);

    let dataProvider=simpleRestProvider('http://localhost:3000');

//                <CollectionResource cid={c} collection={schema.collections[c]} />

    return (
        <Admin dataProvider={dataProvider}>
            {Object.keys(schema.collections).map(c=>
                <Resource name={c} key={c}
                    {...createCollectionComponents(schema.collections[c])} />
            )}
        </Admin>
    );
}
