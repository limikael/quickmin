import {Admin, Layout, Menu, Resource, Title} from 'react-admin';
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
import LoginPage from "./LoginPage.jsx";
import {Button, CardContent, Link} from '@mui/material';
import {Login, LoginForm} from "ra-ui-materialui";
import {collectionResource} from "./collection-components.jsx";
import ViewListIcon from '@mui/icons-material/esm/ViewList';

function loginForm(conf) {
    return function QuickminLogin(props) {
        let [showUserPass,setShowUserPass]=useState(false);
        function onShowUserPassClick(ev) {
            ev.preventDefault();
            setShowUserPass(true);
        }

        function onLoginClick(url) {
            window.location=url;
        }

        if (!Object.keys(conf.authButtons).length)
            showUserPass=true;

        return (<>
            <Login {...props}>
                {showUserPass && <LoginForm />}
                {!!Object.keys(conf.authButtons).length &&
                    <CardContent>
                        {Object.keys(conf.authButtons).map(k=>
                            <Button
                                style="margin-top: 16px"
                                variant="contained"
                                type="submit"
                                color="primary"
                                disabled={false}
                                fullWidth
                                onclick={onLoginClick.bind(null,conf.authButtons[k])}
                            >Login with {k}
                            </Button>
                        )}
                        {!showUserPass &&
                            <Link style="display: block; margin-top: 16px; opacity: 0.5"
                                    href="#" 
                                    align="center"
                                    variant="contained"
                                    onclick={onShowUserPassClick}>
                                Login with username/password
                            </Link>
                        }
                    </CardContent>
                }
            </Login>
        </>)
    }
}

async function fetchConf(apiUrl, setRole, oauthHostname) {
    let confUrl=urlJoin(apiUrl,"_schema");
    if (oauthHostname)
        confUrl+="?oauthHostname="+oauthHostname;

    let response=await fetchEx(confUrl,{
        dataType: "json"
    });

    let conf=response.data;
    for (let cid in conf.collections) {
        for (let fid in conf.collections[cid].fields) {
            let type=conf.collections[cid].fields[fid].type;
            let processor=FIELD_TYPES[type].confProcessor;
            if (processor) 
                processor(conf.collections[cid].fields[fid]);
        }
    }

    conf.apiUrl=apiUrl;
    if (conf.requireAuth) {
        conf.authProvider=new AuthProvider(urlJoin(apiUrl,"_login"),setRole);
        conf.httpClient=conf.authProvider.httpClient;
    }

    conf.dataProvider=new DataProvider(conf);

    let u=new URL(window.location);
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
                    "oauthHostname": oauthHostname
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
    }

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
                        let text=cid;
                        text=text.replaceAll("_"," ");
                        text=text.charAt(0).toUpperCase()+text.slice(1);
                        menuItems.push(<Menu.Item to={"/"+cid+"/single"} 
                            primaryText={text} 
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

function wrapDashboard(dashboard) {
    let Dashboard=dashboard;

    return function() {
        return (<>
            <div style="margin: 1em">
                <Title title="Admin" />
                <Dashboard/>
            </div>
        </>)
    }
}

export default function QuickminAdmin({api, onload, dashboard, oauthHostname}) {
    let [role,setRole]=useState(window.localStorage.getItem("role"));
    let conf=useAsyncMemo(async()=>{
        let conf=await fetchConf(api,setRole,oauthHostname);
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

        if (collection.readAccess.includes(role))
            resources.push(collectionResource({key: cid, ...collection}));
    }

    if (!resources.length)
        resources.push(<Resource/>);

    return (<>
        <Admin dataProvider={conf.dataProvider}
                authProvider={conf.authProvider}
                requireAuth={conf.requireAuth}
                loginPage={loginForm(conf)}
                layout={createLayout(conf,role)}
                dashboard={wrapDashboard(dashboard)}>
            {resources}
        </Admin>
    </>);
}
