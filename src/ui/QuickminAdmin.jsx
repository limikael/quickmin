import {Admin, Layout, Menu, Resource, MenuItemLink, useResourceContext} from 'react-admin';
import {useAsyncMemo} from "../utils/react-util.jsx";
import {fetchEx} from "../utils/js-util.js";
import FIELD_TYPES from "./field-types.jsx";
import CircularProgress from '@mui/material/CircularProgress';
import Card from "@mui/material/Card";
import Box from '@mui/material/Box';
import urlJoin from 'url-join';
import {useMemo, useState, useCallback} from "react";
import AuthProvider from "./AuthProvider";
import DataProvider from "./DataProvider";
import {CollectionEditor, CollectionList} from "./collection-components.jsx";
import {fetchUtils} from "ra-core";
import {render} from "preact";
import QuickminLogin from "./QuickminLogin.jsx";
import QuickminDashboard from "./QuickminDashboard.jsx";
import QuickminLayout from "./QuickminLayout.jsx";

async function fetchConf(apiUrl, setRole) {
    let confUrl=urlJoin(apiUrl,"_schema");
    let response=await fetchEx(confUrl,{
        dataType: "json"
    });

    let conf=response.data;
    conf.apiUrl=apiUrl;

    if (conf.requireAuth) {
        conf.authProvider=new AuthProvider(urlJoin(apiUrl,"_login"),setRole);
        conf.httpClient=conf.authProvider.httpClient;
    }

    else {
        conf.httpClient=fetchUtils.fetchJson;
    }

    conf.dataProvider=new DataProvider(conf);

    for (let cid in conf.collections) {
        for (let fid in conf.collections[cid].fields) {
            let type=conf.collections[cid].fields[fid].type;
            if (!FIELD_TYPES[type])
                throw new Error("Unknown field type: "+type);

            let processor=FIELD_TYPES[type].confProcessor;
            if (processor) 
                processor(conf.collections[cid].fields[fid],conf);
        }
    }

    return conf;
}

function QuickminAdmin({api, onload}) {
    let [role,setRole]=useState();
    let conf=useAsyncMemo(async()=>{
        console.log("loading conf...");
        let conf=await fetchConf(api,setRole);
        if (onload)
            onload();

        return conf;
    },[]);

    if (!conf)
        return;

    //console.log("creating res, roleLevel="+roleLevel);
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

    return (<>
        <Admin dataProvider={conf.dataProvider}
                authProvider={conf.authProvider}
                requireAuth={conf.requireAuth}
                loginPage={<QuickminLogin conf={conf}/>}
                layout={(props)=><QuickminLayout conf={conf} role={role} {...props}/>}
                dashboard={()=><QuickminDashboard conf={conf} role={role}/>}>
            {resources}
        </Admin>
    </>);
}

export function renderQuickminAdmin(props, el) {
    render(<QuickminAdmin {...props}/>,el);
}