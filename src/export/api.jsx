import {createContext, useContext} from "react";
import urlJoin from "url-join";

class QuickminApi {
	constructor({fetch, url}) {
		this.fetch=fetch;
		this.url=url;
	}

	async findMany(table, query={}) {
		let url=urlJoin(this.url,table)+"?filter="+JSON.stringify(query);
		let resultsResponse=await this.fetch(url,{});
		let results=await resultsResponse.json();

		return results;
	}

	async findOne(table, query={}) {
		let results=await this.findMany(table,query);

		return results[0];
	}
}

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

/*export function useQuickminFindOne(table, query={}) {
	let api=useQuickminApi();
	return api.
	let res=useIsoFetch(baseUrl+"?filter="+JSON.stringify(filter));
	if (res)
		return res[0];
}

export function useQuickminFindMany(table, query={}) {

export function useQuickminItems(baseUrl, filter={}) {
	return useIsoFetch(baseUrl+"?filter="+JSON.stringify(filter));
}*/