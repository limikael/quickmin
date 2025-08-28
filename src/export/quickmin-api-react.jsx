export * from "qql/react";

import {createContext, useContext, useRef} from "react";
import {QuickminApi} from "./quickmin-api.js"
import {useConstructor, useEventUpdate} from "../utils/react-util.jsx";
import {QqlProvider} from "qql/react";
import urlJoin from "url-join";
import {parseCookie, clearCookie, responseAssert} from "../utils/js-util.js";

export class QuickminState extends EventTarget {
	constructor({fetch, url, initialUser, quickminCookieName, apiKey, headers, authProviderInfo, children}) {
		super();

		if (!quickminCookieName)
			throw new Error("No quickmin cookie name provided!");

		this.fetch=fetch;
		this.url=url;
		this.api=new QuickminApi({fetch, url, apiKey, headers});
		this.currentUser=initialUser;
		this.quickminCookieName=quickminCookieName;
		this.authProviderInfo=authProviderInfo;

		if (globalThis.window) {
			let cookies=parseCookie(globalThis.window.document.cookie);
			if (cookies.quickmin_login_error) {
				clearCookie("quickmin_login_error");
				this.loginError=new Error(cookies.quickmin_login_error);
			}
		}
	}

	logout() {
		//console.log("logout!!!");

		clearCookie(this.quickminCookieName);

		this.currentUser=null;
		this.dispatchEvent(new Event("change"));
	}

	popLoginError() {
		let e=this.loginError;
		this.loginError=undefined;
		return e;
	}

	async uploadFile(file) {
		return await this.api.uploadFile(file);
	}

	async getAuthUrls(referer, state={}) {
		return await this.api.getAuthUrls(referer, state={});
	}

	getAuthProviderByName(providerName) {
		for (let provider of this.authProviderInfo)
			if (provider.name==providerName)
				return provider;
	}

	async loginByProvider(providerName) {
		let provider=this.getAuthProviderByName(providerName);
		let loginUrl=new URL(provider.loginUrl);

		loginUrl.searchParams.set("state",JSON.stringify({
			provider: provider.name,
			referer: window.location.toString()
		}));

		window.location=loginUrl;
	}

	async login(args) {
		if (!args)
			return await this.loginByProvider(this.authProviderInfo[0].name);

		if (typeof args=="string")
			return await this.loginByProvider(args);

		try {
			let response=await this.api.fetch(urlJoin(this.api.url,"_login"),{
				method: "post",
				body: JSON.stringify(args)
			});
			await responseAssert(response);
			let responseBody=await response.json();
			if (!responseBody.user)
				throw new Error("Can't login with this user");

			window.document.cookie=this.quickminCookieName+"="+responseBody.token+"; path=/";
			this.currentUser=responseBody.user;
			this.dispatchEvent(new Event("change"));
		}

		catch (e) {
			this.loginError=e;
			this.dispatchEvent(new Event("change"));
		}
	}
}

let QuickminContext=createContext();

export function QuickminProvider({children, quickminState, ...props}) {
	let qm=useConstructor(()=>{
		if (quickminState)
			return quickminState;

		//console.log("create qm provider"); 
		return new QuickminState(props)
	});

	return(
		<QuickminContext.Provider value={qm}>
			<QqlProvider
					fetch={qm.fetch} 
					url={urlJoin(qm.url,"_qql")}>
				{children}
			</QqlProvider>
		</QuickminContext.Provider>
	);
}

export function useQuickmin() {
	let quickmin=useContext(QuickminContext);
	useEventUpdate(quickmin,"change");

	return quickmin;	
}

export function useQuickminApi() {
	return useQuickmin();
}

export function useQuickminUser() {
	let quickmin=useQuickmin();
	return quickmin.currentUser;
}

export function useUser() {
	return useQuickminUser();
}

export function useQuickminLogout() {
	let quickmin=useQuickmin();
	return (()=>quickmin.logout());
}

export function useLogout() {
	return useQuickminLogout();
}

export function useAuthProviders() {
	let quickmin=useQuickmin();
	return quickmin.authProviderInfo;
}

export function useLogin({onError}={}) {
	let successCalled=useRef();
	let quickmin=useQuickmin();

	let e=quickmin.popLoginError();
	if (e && onError)
		onError(e);

	return (args=>quickmin.login(args));
}