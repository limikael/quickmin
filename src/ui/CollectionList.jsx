import {Resource, List, Datagrid, Edit, SimpleForm, Create, Toolbar, SaveButton, BulkDeleteButton,
        Button, useListContext, DeleteButton, useSaveContext, FilterButton, CreateButton,
        useRefresh} from "react-admin";
import FIELD_TYPES from "./field-types.jsx";
import {createActionFlow} from "./ActionFlow.jsx";
import {useModal} from "../utils/modal-state.jsx";

export default function CollectionList({conf, collection}) {
    let refresh=useRefresh();
    let {showModal, dismissModal}=useModal();
    let globalActionFlow=createActionFlow({showModal, dismissModal, refresh});

    function BulkActions() {
        let {selectedIds}=useListContext();
        let actionFlow=createActionFlow({selectedIds, showModal, dismissModal, refresh});

        return (<>
            {collection.getActions().getNonGlobal().map(action=>
                <Button label={action.name}
                        onClick={()=>action.run(actionFlow)}/>
            )}
            <BulkDeleteButton/>
        </>);
    }

    let filters=[];
    for (let f of collection.getFields().getVisible()) {
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

    let actions=(
        <div style="white-space: nowrap; text-align: right">
            {collection.getActions().getGlobal().map(action=>
                <Button label={action.name}
                        onClick={()=>action.run(globalActionFlow)}/>
            )}
            <FilterButton/>
            {collection.isWritable() &&
                    collection.getActivePolicy().operations.includes("create") &&
                <CreateButton/>
            }
        </div>
    );

    return (<>
        <List hasCreate={true} exporter={false}
                filters={filters} actions={actions}
                empty={false}>
            <Datagrid rowClick="edit" size="medium"
                    bulkActionButtons={<BulkActions/>}>
                {collection.getFields().getListable().getVisible().map(f=>
                    <f.ListComp source={f.id} {...f} conf={conf} purpose="list"/>
                )}
            </Datagrid>
        </List>
    </>);
}
