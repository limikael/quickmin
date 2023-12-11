import {Admin, Resource} from 'react-admin';
import {useState, render} from "react";
import {useQuickminConf} from "./use-quickmin-conf.jsx";
import {confGetCollections} from "./conf-util.js";
import QuickminLogin from "./QuickminLogin.jsx";
import QuickminDashboard from "./QuickminDashboard.jsx";
import QuickminLayout from "./QuickminLayout.jsx";
import CollectionList from "./CollectionList.jsx";
import CollectionEditor from "./CollectionEditor.jsx";

function QuickminAdmin({api, onload}) {
    let [onloadCalled,setOnloadCalled]=useState();
    let conf=useQuickminConf(api);
    if (!conf)
        return;

    if (!onloadCalled) {
        setOnloadCalled(true);
        onload();
    }

    return (<>
        <Admin dataProvider={conf.dataProvider}
                authProvider={conf.authProvider}
                requireAuth={conf.requireAuth}
                loginPage={<QuickminLogin conf={conf}/>}
                layout={(props)=><QuickminLayout conf={conf} {...props}/>}
                dashboard={()=><QuickminDashboard conf={conf}/>}>
            {confGetCollections(conf).map(collection=>
                <Resource
                        name={collection.id}
                        key={collection.id}
                        list={<CollectionList conf={conf} collection={collection}/>}
                        edit={<CollectionEditor conf={conf} collection={collection} mode="edit"/>}
                        create={<CollectionEditor conf={conf} collection={collection} mode="create"/>}
                        recordRepresentation={collection.recordRepresentation}
                />
            )}
        </Admin>
    </>);
}

export function renderQuickminAdmin(props, el) {
    render(<QuickminAdmin {...props}/>,el);
}