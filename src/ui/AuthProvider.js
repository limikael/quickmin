import {fetchEx} from "../utils/js-util.js";
import {fetchUtils} from "ra-core";

export class AuthError extends Error {};

export default class AuthProvider {
	constructor(url, setRoleLevel) {
		this.url=url;
		this.setRoleLevel=setRoleLevel;
	}

	async checkAuth() {
		if (!window.localStorage.getItem("token"))
			throw new AuthError();
	}

	setLoggedIn(userData) {
    	window.localStorage.setItem("token",userData.token);
    	window.localStorage.setItem("username",userData.username);
    	window.localStorage.setItem("roleLevel",userData.roleLevel);

		console.log("logging in role level: "+userData.roleLevel);
    	this.setRoleLevel(userData.roleLevel);
	}

    login=async (params)=>{
    	let result=await fetchEx(this.url,{
    		dataType: "json",
    		method: "POST",
			headers:{'content-type': 'application/json'},
    		body: JSON.stringify(params)
    	});

    	if (result.status<200 || result.status>=300)
	    	throw new Error("Unable to log in");

	    this.setLoggedIn(result.data);
    }

    async checkError(error) {
		console.log("check error ",error);

    	return (error instanceof AuthError);
    }

    async logout() {
    	window.localStorage.removeItem("token");
    	window.localStorage.removeItem("username");
    	window.localStorage.removeItem("roleLevel");
    	this.setRoleLevel(-1);
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