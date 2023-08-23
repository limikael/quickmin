import {fetchEx} from "../utils/js-util.js";
import {fetchUtils} from "ra-core";

export class AuthError extends Error {};

export default class AuthProvider {
	constructor(url) {
		this.url=url;
	}

	async checkAuth(params) {
		if (!window.localStorage.getItem("token"))
			throw new Error();
	}

    async login(params) {
    	let result=await fetchEx(this.url,{
    		dataType: "json",
    		method: "POST",
			headers:{'content-type': 'application/json'},
    		body: JSON.stringify(params)
    	});

    	if (result.status<200 || result.status>=300)
	    	throw new Error("Unable to log in");

    	window.localStorage.setItem("token",result.data.token);
    	window.localStorage.setItem("username",params.username);
    }

    async checkError(error) {
    	return (error instanceof AuthError);
    }

    async logout() {
    	window.localStorage.removeItem("token");
    	window.localStorage.removeItem("username");
    } 

    async getIdentity() {
		return ({
			fullName: window.localStorage.getItem("username")
		});
    }

    async getPermissions() {
    }

	httpClient=async (url, options={})=>{
	    if (!options.headers)
	        options.headers=new Headers();

	    let token=window.localStorage.getItem("token");
	    if (token)
		    options.headers.set("Authorization","Bearer "+token);

	    return fetchUtils.fetchJson(url,options);
	}
}