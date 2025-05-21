import {Resource, List, Datagrid, Edit, SimpleForm, Create, Toolbar, SaveButton, BulkDeleteButton,
    Button, useListContext, DeleteButton, useSaveContext, FilterButton, CreateButton,
    useRecordContext, useRefresh, TabbedForm, Form, TabbedFormView,
    SelectInput, BooleanInput} from "react-admin";
import { useFormContext, useFormState } from 'react-hook-form';
import FIELD_TYPES from "./field-types.jsx";
import {jsonClone, arrayUnique, urlGetParams, makeNameFromSymbol} from "../utils/js-util.js";
import {TextInput} from "react-admin";
import {IconButton} from "@mui/material";
import {useWatch} from 'react-hook-form';
import {matchCondition} from "./conf-util.js";
import {singular} from "pluralize";
import {SimpleFormView} from "../utils/ra-util.jsx";
import {json5ParseObject} from "../utils/json5-util.js";
import {useModal} from "../utils/modal-state.jsx";
import ActionFlow from "./ActionFlow.jsx";

function useWatchRecord(collection) {
    let conditionDeps=[];
    for (let field of Object.values(collection.fields)) {
        if (field.condition)
            conditionDeps.push(...Object.keys(field.condition));
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
    let {showModal, dismissModal}=useModal();
    let formState=useFormState();
    let actionFlow=new ActionFlow({showModal, dismissModal, refresh, formState});

    return (
        <Toolbar>
            <div class="RaToolbar-defaultToolbar">
                <SaveButton/>
                {collection.getActions().getNonGlobal().map(action=>
                    <Button 
                            label={action.name}
                            onClick={()=>action.run(actionFlow)}/>
                )}
                <div style="flex-grow: 1"></div>
                {collection.type!="singleView" &&
                        collection.isWritable() &&
                        collection.getActivePolicy().operations.includes("delete") &&
                    <DeleteButton redirect={redirect}/>
                }
            </div>
        </Toolbar>
    );
}

function CollectionEditorField({field}) {
    let fieldProps={...field};

    if (!field.isWritable())
        fieldProps.disabled=true;

    fieldProps.defaultValue=field.default;
    delete fieldProps.type;

    return (
        <field.EditComp
                {...fieldProps}
                source={field.id}
                key={field.id}
                purpose="edit"/>
    );
}

function CollectionEditorFields({fields}) {
    return (fields.map(field=>
        <CollectionEditorField field={field}/>
    ));
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

function CollectionEditorFieldsSections({fields}) {
    return (<>
        {fields.getSections().map(section=>
            <>
                <SectionHeader section={section}/>
                <CollectionEditorFields
                        fields={fields.getForSection(section)}/>
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

    let fields=collection.getFields().getVisible()
        .getConditionMatchingRecord(watchRecord);

    if (mode=="create")
        fields=fields.filter(f=>f.type!="referencemany");

    if (!fields.hasTabs()) {
        return (
            <SimpleFormView toolbar={toolbar}>
                <CollectionEditorFieldsSections fields={fields}/>
            </SimpleFormView>
        );
    }

    return (
        <TabbedFormView toolbar={toolbar} syncWithLocation={false}>
            {fields.getTabs().map(tab=>
                <TabbedForm.Tab label={tab?tab:singular(collection.id)}>
                    <CollectionEditorFieldsSections fields={fields.getForTab(tab)}/>
                </TabbedForm.Tab>
            )}
        </TabbedFormView>
    );
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
            let referenceFields=collection.getFields().getVisible().filter(f=>f.type=="referencemany");

            let createRedirect=redirect;

            let url=window.location.toString();
            const [hash, query]=url.split('#')[1].split('?');
            const params=Object.fromEntries(new URLSearchParams(query));
            //console.log(params);

            if (!params.redirect && referenceFields.length)
                createRedirect=null;

            return (
                <Create redirect={createRedirect}>
                    <Form>
                        {content}
                    </Form>
                </Create>
            );
    }
}
