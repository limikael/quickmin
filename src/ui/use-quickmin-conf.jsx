import {useAsyncMemo} from "../utils/react-util.jsx";
import {useState} from "react";
import {fetchEx} from "../utils/js-util.js";
import urlJoin from 'url-join';
import AuthProvider from "./AuthProvider";
import DataProvider from "./DataProvider";
import FIELD_TYPES from "./field-types.jsx";
import {fetchUtils} from "ra-core";

export function useQuickminConf(apiUrl) {
	let [conf,setConf]=useState();
	let [_,setForceUpdateState]=useState();

	useAsyncMemo(async ()=>{
	    let response=await fetchEx(urlJoin(apiUrl,"_schema"),{
	        dataType: "json"
	    });

	    let conf=response.data;
	    conf.apiUrl=apiUrl;

	    if (conf.requireAuth) {
	        conf.authProvider=new AuthProvider(urlJoin(apiUrl,"_login"));
	        conf.authProvider.addEventListener("change",()=>{
	        	conf.role=conf.authProvider.getRole();
	        	setForceUpdateState({});
	        });
	        conf.httpClient=conf.authProvider.httpClient;
	        conf.role=conf.authProvider.getRole();
	    }

	    else {
	        conf.httpClient=fetchUtils.fetchJson;
	        conf.role="admin";
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

	    setConf(conf);

	    //return conf;
	},[]);

	return conf;
}