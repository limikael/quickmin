import {Admin, Resource, ListGuesser, EditGuesser, List, Datagrid, TextField,
        Edit, SimpleForm, TextInput} from 'react-admin';
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
        <Edit>
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

function createCollectionComponents(collection) {
    return {
        list: createListComponent(collection),
        edit: createEditComponent(collection)
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

    return (
        <Admin dataProvider={dataProvider}>
            {Object.keys(schema.collections).map(c=>
                <Resource name={c}
                    {...createCollectionComponents(schema.collections[c])} />
            )}
        </Admin>
    );
}
