import urlJoin from "url-join";

export class QuickminApi {
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

	async getAuthUrls(referer, state={}) {
		let response=await this.fetch(urlJoin(this.url,"_authUrls"),{
			method: "post",
			body: JSON.stringify({
				...state,
				referer: referer,
			})
		});
		return await response.json();
	}
}
