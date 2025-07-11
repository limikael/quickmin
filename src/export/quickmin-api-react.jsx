export * from "qql/react";

import {createContext, useContext} from "react";
import {QuickminApi} from "./quickmin-api.js"
import {useConstructor, useEventUpdate} from "../utils/react-util.jsx";
import {QqlProvider} from "qql/react";
import urlJoin from "url-join";

let QuickminApiContext=createContext();

export function QuickminProvider({fetch, url, initialUser, quickminCookieName, children}) {
	return (
		<QuickminApiProvider fetch={fetch} url={url}>
			<QuickminUserProvider initialUser={initialUser} quickminCookieName={quickminCookieName}>
				<QqlProvider fetch={fetch} url={urlJoin(url,"_qql")}>
					{children}
				</QqlProvider>
			</QuickminUserProvider>
		</QuickminApiProvider>
	)
}

export function QuickminApiProvider({fetch, url, apiKey, headers, children}) {
	let api=new QuickminApi({fetch, url, apiKey, headers});

	return (
		<QuickminApiContext.Provider value={api}>
			{children}
		</QuickminApiContext.Provider>
	);
}

export function useQuickminApi() {
	return useContext(QuickminApiContext);
}

class QuickminUserState extends EventTarget {
	constructor(initialUser, quickminCookieName) {
		super();

		if (!quickminCookieName)
			throw new Error("No quickmin cookie name provided!");

		this.currentUser=initialUser;
		this.quickminCookieName=quickminCookieName;
	}

	logout() {
		console.log("logout!!!");

		// FIX HERE!!!!
		window.document.cookie=this.quickminCookieName+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
		this.currentUser=null;
		this.dispatchEvent(new Event("change"));
	}
}

let QuickminUserContext=createContext();

export function QuickminUserProvider({initialUser, quickminCookieName, children}) {
	let quickminUserState=useConstructor(()=>new QuickminUserState(initialUser,quickminCookieName));

	return (
		<QuickminUserContext.Provider value={quickminUserState}>
			{children}
		</QuickminUserContext.Provider>
	);
}

export function useQuickminUser() {
	let quickminUserState=useContext(QuickminUserContext);
	useEventUpdate(quickminUserState,"change");

	return quickminUserState.currentUser;
}

export function useQuickminLogout() {
	let quickminUserState=useContext(QuickminUserContext);

	return (()=>quickminUserState.logout());
}