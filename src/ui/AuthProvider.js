import {fetchEx, parseCookie} from "../utils/js-util.js";
import {fetchUtils} from "ra-core";
import {useRedirect} from "react-admin";
import {jwtDecode} from "jwt-decode";

export class AuthError extends Error {};

export default class AuthProvider extends EventTarget {
	constructor(url, cookieName) {
		super();

		this.url=url;
		this.cookieName=cookieName;

		if (!this.cookieName)
			throw new Error("Got no cookie name for AuthProvider!!!");
	}

	getRole() {
		let tokenPayload=this.getTokenPayload();
		if (tokenPayload)
			return tokenPayload.role;
	}

	getTokenPayload() {
		let cookies=parseCookie(document.cookie);
		if (cookies[this.cookieName])
			return jwtDecode(cookies[this.cookieName]);
	}

	async checkAuth() {
		if (!this.getTokenPayload())
			throw new AuthError();
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

		window.document.cookie=this.cookieName+"="+result.data.token+"; path=/";
		this.dispatchEvent(new Event("change"));
		//this.setRole(this.getTokenPayload().role);
    }

    async checkError(error) {
		//console.log("check error ",error);

    	return (error instanceof AuthError);
    }

    async logout() {
		window.document.cookie=this.cookieName+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
		this.dispatchEvent(new Event("change"));
    	//this.setRole(null);
    } 

    async getIdentity() {
    	let tokenPayload=this.getTokenPayload();

		return ({
			fullName: tokenPayload.userName
		});
    }

    async getPermissions() {
    }

	httpClient=async (url, options={})=>{
		// not needed when cookie
	    /*if (!options.headers)
	        options.headers=new Headers();

	    let token=window.localStorage.getItem("token");
	    if (token)
		    options.headers.set("Authorization","Bearer "+token);*/

	    return fetchUtils.fetchJson(url,options);
	}
}