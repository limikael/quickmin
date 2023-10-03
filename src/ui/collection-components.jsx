import {Resource, List, Datagrid, Edit, SimpleForm, Create, Toolbar, SaveButton} from "react-admin";
import FIELD_TYPES from "./field-types.jsx";
import {jsonClone} from "../utils/js-util.js";

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
    let fieldContent=[];
    for (let fid in collection.fields) {
        let f={...collection.fields[fid]};

        if (collection.disabled)
            f.disabled=collection.disabled;

        if (!f.hidden) {
            let Comp=FIELD_TYPES[f.type].edit;
            fieldContent.push(
                <Comp source={fid} key={fid} {...f}/>
            );
        }
    }

    let redirect;
    let toolbar;
    if (collection.type=="singleView") {
        redirect=`/${collection.id}/single`;
        let NoSaveToolbar=props=>(
            <Toolbar>
                <SaveButton />
            </Toolbar>
        );

        toolbar=<NoSaveToolbar/>;
    }

    let content=(
        <SimpleForm toolbar={toolbar}>
            {fieldContent}
        </SimpleForm>
    );

    switch (mode) {
        case "edit":
            return (
                <Edit mutationMode="pessimistic" redirect={redirect} >
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

export function collectionResource(collection) {
    return (
        <Resource
                name={collection.key}
                key={collection.key}
                list={collectionList(collection)}
                edit={collectionEditor(collection,"edit")}
                create={collectionEditor(collection,"create")}
                recordRepresentation={collection.recordRepresentation}
        />
    );
}
