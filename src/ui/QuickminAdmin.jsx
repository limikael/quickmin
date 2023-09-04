import {Admin, Resource, List, Datagrid, 
        Edit, SimpleForm, Create, withLifecycleCallbacks} from 'react-admin';
import {useAsyncMemo} from "../utils/react-util.jsx";
import {fetchEx} from "../utils/js-util.js";
import FIELD_TYPES from "./field-types.jsx";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import urlJoin from 'url-join';
import {useMemo} from "react";
import AuthProvider from "./AuthProvider";
import DataProvider from "./DataProvider";

function collectionList(collection) {
    return (
        <List hasCreate={true} exporter={false}>
            <Datagrid rowClick="edit" size="medium">
                {collection.listFields.map(fid=>{
                    let f=collection.fields[fid];
                    let Comp=FIELD_TYPES[f.type].list;
                    return (
                        <Comp source={fid} {...f}/>
                    );
                })}
            </Datagrid>
        </List>
    );
}

function collectionEditor(collection, mode) {
    let content=(
        <SimpleForm>
            {Object.keys(collection.fields).map(fid=>{
                let f=collection.fields[fid];
                let Comp=FIELD_TYPES[f.type].edit;
                return (
                    <Comp source={fid} key={fid} {...f}/>
                );
            })}
        </SimpleForm>
    );

    switch (mode) {
        case "edit":
            return (
                <Edit mutationMode="pessimistic">
                    {content}
                </Edit>
            );

        case "create":
            return (
                <Create redirect="list">
                    {content}
                </Create>
            );
    }
}

function collectionResource(collection) {
    return (
        <Resource
                name={collection.key}
                key={collection.key}
                list={collectionList(collection)}
                edit={collectionEditor(collection,"edit")}
                create={collectionEditor(collection,"create")}/>
    );
}

async function fetchConf(apiUrl) {
    let response=await fetchEx(urlJoin(apiUrl,"_schema"),{
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
        conf.authProvider=new AuthProvider(urlJoin(apiUrl,"_login"));
        conf.httpClient=conf.authProvider.httpClient;
    }

    conf.dataProvider=new DataProvider(conf);

    return conf;
}

export default function QuickminAdmin({api, onload}) {
    let conf=useAsyncMemo(async()=>{
        let conf=await fetchConf(api);

        if (onload)
            onload();

        return conf;
    },[]);

    if (!conf) {
        if (onload)
            return;

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
        );
    }

    return (<>
        <Admin dataProvider={conf.dataProvider}
                authProvider={conf.authProvider}
                requireAuth={conf.requireAuth}>
            {Object.keys(conf.collections).map(c=>
                collectionResource({key: c,...conf.collections[c]})
            )}
        </Admin>
    </>);
}
