import {Admin, Resource} from 'react-admin';
import {useState, render} from "react";
import {useQuickminConf} from "./use-quickmin-conf.jsx";
import QuickminLogin from "./QuickminLogin.jsx";
import QuickminDashboard from "./QuickminDashboard.jsx";
import QuickminLayout from "./QuickminLayout.jsx";
import CollectionList from "./CollectionList.jsx";
import CollectionEditor from "./CollectionEditor.jsx";

function getQuickminResources({conf, role}) {
    let resources=[];
    for (let cid in conf.collections) {
        let collection=conf.collections[cid];
        collection.disabled=!collection.access.includes(role);

        if (collection.readAccess.includes(role))
            resources.push(
                <Resource
                        name={collection.id}
                        key={collection.id}
                        list={<CollectionList collection={collection}/>}
                        edit={<CollectionEditor conf={conf} collection={collection} mode="edit"/>}
                        create={<CollectionEditor conf={conf} collection={collection} mode="create"/>}
                        recordRepresentation={collection.recordRepresentation}
                />
            );
    }

    if (!resources.length)
        resources.push(<Resource/>);

    return resources;
}

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
                layout={(props)=><QuickminLayout conf={conf} role={conf.role} {...props}/>}
                dashboard={()=><QuickminDashboard conf={conf} role={conf.role}/>}>
            {getQuickminResources({conf,role: conf.role})}
        </Admin>
    </>);
}

export function renderQuickminAdmin(props, el) {
    render(<QuickminAdmin {...props}/>,el);
}