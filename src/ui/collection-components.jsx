import {Resource, List, Datagrid, Edit, SimpleForm, Create, Toolbar, SaveButton, BulkDeleteButton,
        Button, useListContext, DeleteButton, useSaveContext} from "react-admin";
import { useFormContext, useFormState } from 'react-hook-form';
import FIELD_TYPES from "./field-types.jsx";
import {jsonClone} from "../utils/js-util.js";
import {ActionDialog, useActionState} from "./actions.jsx";

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

function collectionList(collection) {
    return ()=>{
        let actionState=useActionState();

        function BulkActions() {
            let actionItems=[];
            for (let action of collection.actions)
                actionItems.push(
                    <ListActionButton 
                            action={action} 
                            actionState={actionState}/>
                );

            return (<>
                {actionItems}
                <BulkDeleteButton/>
            </>);
        }

        return (<>
            <ActionDialog actionState={actionState}/>
            <List hasCreate={true} exporter={false}>
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
}

function collectionEditor(collection, mode) {
    return ()=>{
        let actionState=useActionState();

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
        let toolbarItems=[];
        toolbarItems.push(<SaveButton/>);

        if (mode=="edit") {
            for (let action of collection.actions)
                toolbarItems.push(
                    <EditActionButton 
                            action={action}
                            actionState={actionState}/>
                );
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
                {fieldContent}
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
