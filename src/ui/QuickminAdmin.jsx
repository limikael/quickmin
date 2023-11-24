import {Admin, Layout, Menu, Resource} from 'react-admin';
import {useAsyncMemo} from "../utils/react-util.jsx";
import {fetchEx, makeNameFromSymbol} from "../utils/js-util.js";
import FIELD_TYPES from "./field-types.jsx";
import CircularProgress from '@mui/material/CircularProgress';
import Card from "@mui/material/Card";
import Box from '@mui/material/Box';
import urlJoin from 'url-join';
import {useMemo, useState, useCallback} from "react";
import AuthProvider from "./AuthProvider";
import DataProvider from "./DataProvider";
import {collectionResource} from "./collection-components.jsx";
import ViewListIcon from '@mui/icons-material/esm/ViewList';
import {fetchUtils} from "ra-core";
import {render} from "preact";
import QuickminLogin from "./QuickminLogin.jsx";
import QuickminDashboard from "./QuickminDashboard.jsx";

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

    /*let u=new URL(window.location);
    if (u.searchParams.get("code") &&
            u.searchParams.get("scope") &&
            u.searchParams.get("authuser") &&
            u.searchParams.get("prompt")) {
        try {
            let result=await fetchEx(urlJoin(apiUrl,"_oauthLogin"),{
                method: "POST",
                headers:{'content-type': 'application/json'},
                body: JSON.stringify({
                    "url": window.location.toString(),
                    "state": u.searchParams.get("state"),
                }),
                dataType: "json"
            });

            conf.authProvider.setLoggedIn(result.data);
            //history.replaceState(null,"",u.origin+u.pathname);
            window.location=u.origin+u.pathname;
            return;
        }

        catch (e) {
            console.log(e);
        }
    }*/

    return conf;
}

function Spinner() {
    return (
        <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh"
                }}>
            <CircularProgress size="3em"/>
        </div>
    )
}

function createLayout(conf, role) {
    return function QuickminLayout(props) {
        let menuItems=[];

        menuItems.push(<Menu.DashboardItem/>);

        for (let cid in conf.collections) {
            let collection=conf.collections[cid];
            if (collection.readAccess.includes(role)) {
                switch (collection.type) {
                    case "singleView":
                        menuItems.push(<Menu.Item to={"/"+cid+"/single"} 
                            primaryText={makeNameFromSymbol(cid)} 
                            leftIcon={<ViewListIcon/>}
                        />);
                        break;

                    default:
                        menuItems.push(<Menu.ResourceItem name={cid} />);
                        break;
                }
            }
        }

        if (!menuItems.length)
            menuItems.push(<Menu.DashboardItem/>);

        function QuickminMenu() {
            return (
                <Menu>
                    {menuItems}
                </Menu>    
            );
        }

        return (
            <Layout {...props} menu={QuickminMenu}/>
        )
    }
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

    if (!conf) {
        if (onload)
            return;

        return (<Spinner/>);
    }

    //console.log("creating res, roleLevel="+roleLevel);
    let resources=[];
    for (let cid in conf.collections) {
        let collection=conf.collections[cid];

        collection.disabled=!collection.access.includes(role);

        if (collection.readAccess.includes(role) &&
                !collection.hidden)
            resources.push(collectionResource({key: cid, ...collection}));
    }

    if (!resources.length)
        resources.push(<Resource/>);

    return (<>
        <Admin dataProvider={conf.dataProvider}
                authProvider={conf.authProvider}
                requireAuth={conf.requireAuth}
                loginPage={<QuickminLogin conf={conf}/>}
                layout={createLayout(conf,role)}
                dashboard={()=><QuickminDashboard conf={conf} role={role}/>}>
            {resources}
        </Admin>
    </>);
}

export function renderQuickminAdmin(props, el) {
    render(<QuickminAdmin {...props}/>,el);
}