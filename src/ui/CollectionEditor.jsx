import {Resource, List, Datagrid, Edit, SimpleForm, Create, Toolbar, SaveButton, BulkDeleteButton,
    Button, useListContext, DeleteButton, useSaveContext, FilterButton, CreateButton,
    useRecordContext, useRefresh, TabbedForm, Form, TabbedFormView,
    SelectInput, BooleanInput} from "react-admin";
import { useFormContext, useFormState } from 'react-hook-form';
import FIELD_TYPES from "./field-types.jsx";
import {jsonClone, arrayUnique, urlGetParams, makeNameFromSymbol} from "../utils/js-util.js";
import {ActionDialog, useActionState} from "./actions.jsx";
import {TextInput} from "react-admin";
import {IconButton} from "@mui/material";
import {useWatch} from 'react-hook-form';
import {matchCondition, collectionHasUntabbed, collectionGetVisibleTabs} from "./conf-util.js";
import {singular} from "pluralize";
import {SimpleFormView} from "../utils/ra-util.jsx";

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

    conditionDeps=arrayUnique(conditionDeps);
    let watch=useWatch({name: conditionDeps});
    let watchRecord=Object.fromEntries(
        [...Array(conditionDeps.length).keys()].map(i=>[conditionDeps[i],watch[i]])
    );

    return watchRecord;
}

function CollectionToolbar({conf, collection, mode, redirect}) {
    let refresh=useRefresh();
    let actionState=useActionState(conf, refresh);

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
    if (collection.type!="singleView" && collection.isWritable())
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

function CollectionEditorFields({collection, conf, tab, section, watchRecord}) {
    let fieldContent=[];
    for (let fid in collection.fields) {
        let f={...collection.fields[fid]};

        if (!collection.isWritable())
            f.disabled=true;

        let matched=true;
        if (f.condition)
            matched=matchCondition(watchRecord,JSON.parse(f.condition));

        if (f.tab!=tab)
            matched=false;

        if (f.section!=section)
            matched=false;

        if (/*!f.hidden &&*/ matched) {
            let Comp=FIELD_TYPES[f.type].edit;
            delete f.type;

            f.defaultValue=f.default;

            fieldContent.push(
                <Comp source={fid} key={fid} conf={conf} collection={collection} {...f}/>
            );
        }
    }

    return fieldContent;
}

function SectionHeader({section}) {
    if (!section)
        return;

    let style={
        color: "#2196F3",
        marginTop: "1rem",
        marginBottom: "1rem",
        borderBottom: "1px solid #2196F3",
        fontWeight: "bold",
        width: "100%"
    }

    return (
        <div style={style}>
            {section}
        </div>
    );
}

function CollectionEditorFieldsSections({collection, watchRecord, conf, tab}) {
    return (<>
        {collection.getSectionsForTab(tab).map(section=>
            <>
                <SectionHeader section={section}/>
                <CollectionEditorFields
                        collection={collection}
                        watchRecord={watchRecord}
                        conf={conf}
                        tab={tab}
                        section={section}/>
            </>
        )}
    </>);
}

function CollectionFormView({collection, mode, redirect, conf}) {
    let watchRecord=useWatchRecord(collection);
    //console.log("watch record: ",watchRecord);

    let toolbar=(
        <CollectionToolbar
                conf={conf}
                collection={collection}
                mode={mode}
                redirect={redirect}/>
    )

    let tabs=collection.getTabs(); //collection);
    let visibleTabs=collectionGetVisibleTabs(collection,watchRecord);
    if (tabs.length>0) {
        return (
            <TabbedFormView toolbar={toolbar} syncWithLocation={false}>
                {collectionHasUntabbed(collection) &&
                    <TabbedForm.Tab label={singular(collection.id)}>
                        <CollectionEditorFieldsSections 
                                watchRecord={watchRecord}
                                collection={collection} 
                                conf={conf}/>
                    </TabbedForm.Tab>
                }
                {visibleTabs.map(tab=>
                    <TabbedForm.Tab label={tab}>
                        <CollectionEditorFieldsSections 
                                watchRecord={watchRecord}
                                collection={collection} 
                                conf={conf} 
                                tab={tab}/>
                    </TabbedForm.Tab>
                )}
            </TabbedFormView>
        );
    }

    else {
        return (
            <SimpleFormView toolbar={toolbar}>
                <CollectionEditorFieldsSections
                            watchRecord={watchRecord}
                            collection={collection}
                            conf={conf}/>
            </SimpleFormView>
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
        <CollectionFormView
                collection={collection}
                mode={mode}
                redirect={redirect}
                conf={conf}/>
    );

    switch (mode) {
        case "edit":
            return (<>
                <Edit mutationMode="pessimistic" redirect={redirect}>
                    <Form>
                        {content}
                    </Form>
                </Edit>
            </>);

        case "create":
            return (
                <Create redirect={redirect}>
                    <Form>
                        {content}
                    </Form>
                </Create>
            );
    }
}
