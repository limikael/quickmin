import {Resource, List, Datagrid, Edit, SimpleForm, Create, Toolbar, SaveButton, BulkDeleteButton,
        Button, useListContext, DeleteButton, useSaveContext, FilterButton, CreateButton,
        useRefresh} from "react-admin";
import FIELD_TYPES from "./field-types.jsx";
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

function GlobalActionButton({action, actionState}) {
    async function onClick() {
        await actionState.runGlobalAction(action);
    }

    return (
        <Button label={action.name} onClick={onClick}/>
    )
}

export default function CollectionList({collection}) {
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
