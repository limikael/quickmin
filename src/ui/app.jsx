import {Admin, Resource, ListGuesser, EditGuesser, List, Datagrid, TextField,
        Edit, SimpleForm, TextInput, Create} from 'react-admin';
import {RichTextInput} from 'ra-input-rich-text';
import simpleRestProvider from 'ra-data-simple-rest';
import {useAsyncMemo} from "../utils/react-util.jsx";
import {fetchEx} from "../utils/js-util.js";

function collectionList(collection) {
    let REACT_LIST_TYPES={
        "text": TextField,
        "richtext": TextField
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
        "richtext": RichTextInput
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
    let schema=useAsyncMemo(async()=>{
        let response=await fetchEx("http://localhost:3000/_schema",{
            dataType: "json"
        });

        return response.data;
    },[]);

    if (!schema)
        return "Loading...";

    console.log("render...");

    let dataProvider=simpleRestProvider('http://localhost:3000');

    return (
        <Admin dataProvider={dataProvider}>
            {Object.keys(schema.collections).map(c=>
                collectionResource({key: c,...schema.collections[c]})
            )}
        </Admin>
    );

/*    return (
        <Admin dataProvider={dataProvider}>
            <Resource name="posts" list={PostsList}>
            </Resource>
        </Admin>
    );*/
}
