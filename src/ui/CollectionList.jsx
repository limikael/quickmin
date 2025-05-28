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
        await actionState.runAction(action);
    }

    return (
        <Button label={action.name} onClick={onClick}/>
    )
}

export default function CollectionList({conf, collection}) {
    let refresh=useRefresh();
    let actionState=useActionState(conf, refresh);

    function BulkActions() {
        let actionItems=[];
        for (let action of collection.actions) {
            if (action.scope!="global") {
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
    for (let f of collection.getFields()/*.getVisible()*/) {
        if (f.filter) {
            if (!FIELD_TYPES[f.type].filter)
                throw new Error("Can't filter on that");

            let alwaysOn=true;
            if (String(f.filter).includes("optional"))
                alwaysOn=false;

            let Comp=FIELD_TYPES[f.type].filter;
            filters.push(
                 <Comp source={f.id} {...f} alwaysOn={alwaysOn} conf={conf} purpose="filter"/>,
            );
        }
    }

    let globalActionItems=[];
    for (let action of collection.actions) {
        if (action.scope=="global") {
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
            {collection.isWritable() &&
                    collection.getOperationPolicies("update").length>0 &&
                <CreateButton/>
            }
        </div>
    );

    return (<>
        <ActionDialog actionState={actionState}/>
        <List hasCreate={true} exporter={false}
                filters={filters} actions={actions}
                empty={false}>
            <Datagrid rowClick="edit" size="medium"
                    bulkActionButtons={<BulkActions/>}>
                {collection.getFields().getListable()/*.getVisible()*/.map(f=>
                    <f.ListComp source={f.id} {...f} conf={conf} purpose="list"/>
                )}
            </Datagrid>
        </List>
    </>);
}
