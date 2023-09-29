import {createContext, useContext} from "react";
import {QuickminApi} from "./api.js"

let QuickminApiContext=createContext();

export function QuickminApiProvider({fetch, url, children}) {
	let api=new QuickminApi({fetch, url});

	return (<>
		<QuickminApiContext.Provider value={api}>
			{children}
		</QuickminApiContext.Provider>
	</>);
}

export function useQuickminApi() {
	return useContext(QuickminApiContext);
}
