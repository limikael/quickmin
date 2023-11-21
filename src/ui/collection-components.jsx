import {Resource, List, Datagrid, Edit, SimpleForm, Create, Toolbar, SaveButton, BulkDeleteButton,
        Button, useListContext, DeleteButton, useSaveContext, FilterButton, CreateButton,
        useRecordContext, useRefresh} from "react-admin";
import { useFormContext, useFormState } from 'react-hook-form';
import FIELD_TYPES from "./field-types.jsx";
import {jsonClone, arrayOnlyUnique} from "../utils/js-util.js";
import {ActionDialog, useActionState} from "./actions.jsx";
import {TextInput} from "react-admin";
import {IconButton} from "@mui/material";
import { useWatch } from 'react-hook-form';

function GlobalActionButton({action, actionState}) {
    async function onClick() {
        await actionState.runGlobalAction(action);
    }

    return (
        <Button label={action.name} onClick={onClick}/>
    )
}

function ListActionButton({action, actionState}) {
    let {selectedIds}=useListContext();

    async function onClick() {
        await actionState.runAction(action,selectedIds);
    }

    return (
        <Button label={action.name} onClick={onClick}/>
    )
}

function EditActionButton({action, actionState}) {
    let formState=useFormState();

    async function onClick() {
        let id=formState.defaultValues.id;
        await actionState.runAction(action,[id]);
    }

    return (
        <Button label={action.name} onClick={onClick}/>
    );
}

function CollectionList({collection}) {
    let refresh=useRefresh();
    let actionState=useActionState(refresh);

    function BulkActions() {
        let actionItems=[];
        for (let action of collection.actions) {
            if (!action.global) {
                actionItems.push(
                    <ListActionButton 
                            action={action} 
                            actionState={actionState}/>
                );
            }
        }

        return (<>
            {actionItems}
            <BulkDeleteButton/>
        </>);
    }

    let filters=[];
    for (let fid in collection.fields) {
        let f=collection.fields[fid];
        if (f.filter) {
            if (!FIELD_TYPES[f.type].filter)
                throw new Error("Can't filter on that");

            let alwaysOn=true;
            if (f.filter=="optional")
                alwaysOn=false;

            let Comp=FIELD_TYPES[f.type].filter;
            filters.push(
                 <Comp source={fid} {...f} alwaysOn={alwaysOn}/>,
            );
        }
    }

    let globalActionItems=[];
    for (let action of collection.actions) {
        if (action.global) {
            globalActionItems.push(
                <GlobalActionButton 
                        action={action}
                        actionState={actionState}/>
            );
        }
    }

    let actions=(
        <div style="white-space: nowrap; text-align: right">
            {globalActionItems}
            <FilterButton/>
            <CreateButton/>
        </div>
    );

    return (<>
        <ActionDialog actionState={actionState}/>
        <List hasCreate={true} exporter={false}
                filters={filters} actions={actions}>
            <Datagrid rowClick="edit" size="medium"
                    bulkActionButtons={<BulkActions/>}>
                {collection.listFields.map(fid=>{
                    let f=collection.fields[fid];
                    let Comp=FIELD_TYPES[f.type].list;
                    return (
                        <Comp source={fid} {...f}/>
                    );
                })}
            </Datagrid>
        </List>
    </>);
}

/*function parseCondition(s) {
    return Object.fromEntries(s.split(",").map(c=>c.split("=")));
}*/

/*function getConditionDeps(condition) {
    return condition.map(c=>c[0]);
}*/

function matchCondition(record, where) {
    for (let k in where) {
        console.log(where[k]);
        if (Array.isArray(where[k])) {
            if (!where[k].includes(record[k]))
                return false;
        } 

        else {
            if (record[k]!=where[k])
                return false;
        }
    }

    return true;
}

function CollectionEditorFields({collection}) {
    let conditionDeps=[];
    for (let fid in collection.fields) {
        let f=collection.fields[fid];
        if (f.condition) {
            conditionDeps=[
                ...conditionDeps,
                ...Object.keys(JSON.parse(f.condition))
            ];
        }
    }

    conditionDeps=arrayOnlyUnique(conditionDeps);
    let watch=useWatch({name: conditionDeps});
    let watchRecord=Object.fromEntries(
        [...Array(conditionDeps.length).keys()].map(i=>[conditionDeps[i],watch[i]])
    );

    let fieldContent=[];
    for (let fid in collection.fields) {
        let f={...collection.fields[fid]};

        if (collection.disabled)
            f.disabled=collection.disabled;

        let matched=true;
        if (f.condition)
            matched=matchCondition(watchRecord,JSON.parse(f.condition));

        if (!f.hidden && matched) {
            let Comp=FIELD_TYPES[f.type].edit;
            fieldContent.push(
                <Comp source={fid} key={fid} {...f}/>
            );
        }
    }

    return fieldContent;
}

function CollectionEditor({collection, mode}) {
    let refresh=useRefresh();
    let actionState=useActionState(refresh);

    let redirect;
    let toolbarItems=[];
    toolbarItems.push(<SaveButton/>);

    if (mode=="edit") {
        for (let action of collection.actions) {
            if (!action.global) {
                toolbarItems.push(
                    <EditActionButton 
                            action={action}
                            actionState={actionState}/>
                );
            }
        }
    }

    toolbarItems.push(<div style="flex-grow: 1"></div>);

    if (collection.type=="singleView") {
        redirect=`/${collection.id}/single`;
    }

    else {
        toolbarItems.push(<DeleteButton/>);
    }

    let toolbar=(
        <Toolbar>
            <div class="RaToolbar-defaultToolbar">
                {toolbarItems}
            </div>
        </Toolbar>
    );

    let content=(
        <SimpleForm toolbar={toolbar}>
            <CollectionEditorFields collection={collection}/>
        </SimpleForm>
    );

    switch (mode) {
        case "edit":
            return (<>
                <ActionDialog actionState={actionState}/>
                <Edit mutationMode="pessimistic" redirect={redirect}>
                    {content}
                </Edit>
            </>);

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
                list={<CollectionList collection={collection}/>}
                edit={<CollectionEditor collection={collection} mode={"edit"}/>}
                create={<CollectionEditor collection={collection} mode={"create"}/>}
                recordRepresentation={collection.recordRepresentation}
        />
    );
}
