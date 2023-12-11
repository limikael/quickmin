import {Resource, List, Datagrid, Edit, SimpleForm, Create, Toolbar, SaveButton, BulkDeleteButton,
        Button, useListContext, DeleteButton, useSaveContext, FilterButton, CreateButton,
        useRecordContext, useRefresh, TabbedForm} from "react-admin";
import { useFormContext, useFormState } from 'react-hook-form';
import FIELD_TYPES from "./field-types.jsx";
import {jsonClone, arrayOnlyUnique, urlGetParams, makeNameFromSymbol} from "../utils/js-util.js";
import {ActionDialog, useActionState} from "./actions.jsx";
import {TextInput} from "react-admin";
import {IconButton} from "@mui/material";
import {useWatch} from 'react-hook-form';
import {matchCondition, collectionGetTabs, collectionHasUntabbed} from "./conf-util.js";
import {singular} from "pluralize";

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

function useWatchRecord(collection) {
    let conditionDeps=[];
    for (let field of Object.values(collection.fields)) {
        if (field.condition)
            conditionDeps.push(...Object.keys(JSON.parse(field.condition)));
    }

    conditionDeps=arrayOnlyUnique(conditionDeps);
    let watch=useWatch({name: conditionDeps});
    let watchRecord=Object.fromEntries(
        [...Array(conditionDeps.length).keys()].map(i=>[conditionDeps[i],watch[i]])
    );

    return watchRecord;
}

function CollectionToolbar({collection, mode, redirect}) {
    let refresh=useRefresh();
    let actionState=useActionState(refresh);

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
    if (collection.type!="singleView")
        toolbarItems.push(<DeleteButton redirect={redirect}/>);

    return (
        <Toolbar>
            <ActionDialog actionState={actionState}/>
            <div class="RaToolbar-defaultToolbar">
                {toolbarItems}
            </div>
        </Toolbar>
    );
}

function CollectionEditorFields({collection, conf, tab}) {
    let watchRecord=useWatchRecord(collection);
    //console.log(watchRecord);

    let fieldContent=[];
    for (let fid in collection.fields) {
        let f={...collection.fields[fid]};

        if (collection.disabled)
            f.disabled=collection.disabled;

        let matched=true;
        if (f.condition)
            matched=matchCondition(watchRecord,JSON.parse(f.condition));

        if (f.tab!=tab)
            matched=false;

        if (!f.hidden && matched) {
            let Comp=FIELD_TYPES[f.type].edit;
            fieldContent.push(
                <Comp source={fid} key={fid} conf={conf} collection={collection} {...f}/>
            );
        }
    }

    return fieldContent;
}

function CollectionForm({collection, mode, redirect, conf}) {
    let toolbar=(
        <CollectionToolbar
                collection={collection}
                mode={mode}
                redirect={redirect}/>
    )

    let tabs=collectionGetTabs(collection);
    if (tabs.length>0) {
        return (
            <TabbedForm toolbar={toolbar}>
                {collectionHasUntabbed(collection) &&
                    <TabbedForm.Tab label={singular(collection.id)}>
                        <CollectionEditorFields 
                                collection={collection} 
                                conf={conf}/>
                    </TabbedForm.Tab>
                }
                {tabs.map(tab=>
                    <TabbedForm.Tab label={tab}>
                        <CollectionEditorFields 
                                collection={collection} 
                                conf={conf} 
                                tab={tab}/>
                    </TabbedForm.Tab>
                )}
            </TabbedForm>
        );
    }

    else {
        return (
            <SimpleForm toolbar={toolbar}>
                <CollectionEditorFields collection={collection} conf={conf}/>
            </SimpleForm>
        );
    }
}

export default function CollectionEditor({collection, mode, conf}) {
    function redirect() {
        if (collection.type=="singleView")
            return `${collection.id}/single`;

        let url=window.location.toString();
        const [hash, query]=url.split('#')[1].split('?');
        const params=Object.fromEntries(new URLSearchParams(query));
        if (params.redirect)
            return params.redirect;

        return `${collection.id}`;
    }

    let content=(
        <CollectionForm
                collection={collection}
                mode={mode}
                redirect={redirect}
                conf={conf}/>
    );

    switch (mode) {
        case "edit":
            return (<>
                <Edit mutationMode="pessimistic" redirect={redirect}>
                    {content}
                </Edit>
            </>);

        case "create":
            return (
                <Create redirect={redirect}>
                    {content}
                </Create>
            );
    }
}
