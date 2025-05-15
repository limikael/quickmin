import {useRef, useState} from "react";
import {createQqlClient} from "qql";
import {fetchEx} from "../utils/js-util.js";
import FIELD_TYPES from "./field-types.jsx";
import urlJoin from 'url-join';
import AuthProvider from "./AuthProvider";
import DataProvider from "./DataProvider";
import {useEventUpdate} from "../utils/react-util.jsx";
import ClientCollection from "./ClientCollection.js";

export default class ClientConf extends EventTarget {
	constructor({apiUrl, fetch}) {
		super();

		this.apiUrl=apiUrl;
		this.fetch=fetch;
		if (!this.fetch)
			this.fetch=globalThis.fetch.bind(globalThis);
	}

	isLoading() {
		return !this.loadComplete;
	}

	isError() {
		return !!this.error;
	}

	async load() {
		try {
		    let response=await fetchEx(urlJoin(this.apiUrl,"_schema"),{
		        dataType: "json"
		    });

		    Object.assign(this,response.data);

		    let clientCollections={}
		    for (let k in this.collections)
		    	clientCollections[k]=new ClientCollection(this.collections[k],this);

		    this.collections=clientCollections;

		    this.clientModules=[];
		    for (let clientImport of this.clientImports) {
		    	let u=new URL(clientImport,this.apiUrl+"/");
		    	this.clientModules.push(await import(u));
		    }

		    if (this.requireAuth) {
		        this.authProvider=new AuthProvider(urlJoin(this.apiUrl,"_login"),this.cookie);
		        this.authProvider.addEventListener("change",()=>{
		        	if (this.authProvider.getRole()!=this.role) {
			        	this.role=this.authProvider.getRole();
			        	this.dispatchEvent(new Event("change"));
		        	}
		        });
		        this.httpClient=this.authProvider.httpClient;
		        this.role=this.authProvider.getRole();
		    }

		    else {
		        this.httpClient=fetchUtils.fetchJson;
		        this.role="admin";
		    }

		    this.dataProvider=new DataProvider(this);

		    for (let cid in this.collections) {
		        for (let fid in this.collections[cid].fields) {
		            let type=this.collections[cid].fields[fid].type;
		            if (!FIELD_TYPES[type])
		                throw new Error("Unknown field type: "+type);

		            let processor=FIELD_TYPES[type].confProcessor;
		            if (processor) 
		                processor(this.collections[cid].fields[fid],this);
		        }
		    }

		    this.qql=createQqlClient(urlJoin(this.apiUrl,"_qql"),{
		    	fetch: window.fetch.bind(window)
		    });
		}

		catch (e) {
			console.log("**** load error ****");
			console.log(e);
			this.error=e;
		}

		this.loadComplete=true;
	}

	getCollections() {
		return Object.values(this.collections);
	}

	getVisibleCollections() {
		return this.getCollections().filter(c=>c.isVisible());
	}

    getVisibleCollectionsByCategory(category) {
    	return this.getVisibleCollections().filter(c=>c.category==category);
    }

    getClientMethod(name) {
	    for (let clientModule of this.clientModules)
	        if (clientModule[name])
	            return clientModule[name]
	}

	getCallbackParams() {
		return ({
			qql: this.qql
		});
	}
}

export function useQuickminConf(apiUrl) {
	let ref=useRef();
	let [_,setForceUpdateState]=useState({});
	if (!ref.current) {
		ref.current=new ClientConf({apiUrl: apiUrl});
		ref.current.load().finally(()=>setForceUpdateState());
	}

	useEventUpdate(ref.current,"change");

	return ref.current;
}