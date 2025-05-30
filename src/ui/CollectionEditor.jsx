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

    conditionDeps.push("$policyInfo");

    conditionDeps=arrayUnique(conditionDeps);
    //console.log("cond deps: ",conditionDeps);

    let watch=useWatch({name: conditionDeps});
    let watchRecord=Object.fromEntries(
        [...Array(conditionDeps.length).keys()].map(i=>[conditionDeps[i],watch[i]])
    );

    return watchRecord;
}

function CollectionToolbar({conf, collection, mode, redirect, policyInfo}) {
    let refresh=useRefresh();
    let {showModal, dismissModal}=useModal();
    let formState=useFormState();
    let actionFlow=new ActionFlow({showModal, dismissModal, refresh, formState});

    return (
        <Toolbar>
            <div class="RaToolbar-defaultToolbar">
                <SaveButton/>
                {mode=="edit" &&
                        collection.getActions().getNonGlobal().map(action=>
                    <Button 
                            label={action.name}
                            onClick={()=>action.run(actionFlow)}/>
                )}
                <div style="flex-grow: 1"></div>
                {collection.type!="singleView" &&
                        policyInfo.delete &&
                    <DeleteButton redirect={redirect}/>
                }
            </div>
        </Toolbar>
    );
}

function CollectionEditorField({field, policyInfo}) {
    let fieldProps={...field};

    if (!policyInfo.updateFields.includes(field.id))
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

function CollectionEditorFields({fields, policyInfo}) {
    return (fields.map(field=>
        <CollectionEditorField field={field} policyInfo={policyInfo}/>
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

function CollectionEditorFieldsSections({fields, policyInfo}) {
    return (<>
        {fields.getSections().map(section=>
            <>
                <SectionHeader section={section}/>
                <CollectionEditorFields
                        fields={fields.getForSection(section)}
                        policyInfo={policyInfo}/>
            </>
        )}
    </>);
}

function CollectionFormView({collection, mode, redirect, conf}) {
    let watchRecord=useWatchRecord(collection);
    let policyInfo;

    //console.log("render collection form");

    switch (mode) {
        case "edit":
            policyInfo=watchRecord.$policyInfo;
            break;

        case "create":
            policyInfo={
                readFields: collection.getWideFieldSet("create"),
                updateFields: collection.getWideFieldSet("create")
            }
            break;
    }

    if (!policyInfo)
        return;

    let policyFields=arrayUnique([...policyInfo.readFields,...policyInfo.updateFields]);

    let toolbar=(
        <CollectionToolbar
                conf={conf}
                collection={collection}
                mode={mode}
                redirect={redirect}
                policyInfo={policyInfo}/>
    )

    let fields=collection.getFields()
        .filter(f=>policyFields.includes(f.id) || (f.type=="referencemany" && collection.getWideFieldSet("read").includes(f.id)))
        .getConditionMatchingRecord(watchRecord);

    if (mode=="create")
        fields=fields.filter(f=>f.type!="referencemany");

    if (!fields.hasTabs()) {
        return (
            <SimpleFormView toolbar={toolbar}>
                <CollectionEditorFieldsSections fields={fields} policyInfo={policyInfo}/>
            </SimpleFormView>
        );
    }

    return (
        <TabbedFormView toolbar={toolbar} syncWithLocation={false}>
            {fields.getTabs().map(tab=>
                <TabbedForm.Tab label={tab?tab:singular(collection.id)}>
                    <CollectionEditorFieldsSections fields={fields.getForTab(tab)} policyInfo={policyInfo}/>
                </TabbedForm.Tab>
            )}
        </TabbedFormView>
    );
}

function getRedirecter({collection, mode}) {
   // console.log("redirecter...");

    if (mode=="create" &&
            collection.getFields().getInWideSet("create").filter(f=>f.type=="referencemany").length) {
        return;
    }

    if (collection.type=="singleView")
        return ()=>`${collection.id}/single`;

    let params=urlGetParams(window.location,{afterHash: true});
    if (params.redirect)
        return ()=>params.redirect;

    return ()=>collection.id;
}

export default function CollectionEditor({collection, mode, conf}) {
    let content=(
        <CollectionFormView
                collection={collection}
                mode={mode}
                redirect={getRedirecter({collection,mode})}
                conf={conf}/>
    );

    switch (mode) {
        case "edit":
            return (<>
                <Edit mutationMode="pessimistic"
                        redirect={getRedirecter({collection,mode})}>
                    <Form>
                        {content}
                    </Form>
                </Edit>
            </>);

        case "create":
            return (
                <Create redirect={getRedirecter({collection,mode})}>
                    <Form>
                        {content}
                    </Form>
                </Create>
            );
    }
}
