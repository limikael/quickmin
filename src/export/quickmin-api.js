import urlJoin from "url-join";

export class QuickminApi {
	constructor(options={}) {
		this.fetch=globalThis.fetch.bind(globalThis);
		if (options.fetch)
			this.fetch=options.fetch;

		this.url=options.url;
		if (!this.url)
			throw new Error("Need url for QuickminApi");

		this.headers=new Headers();
		if (options.headers)
			this.headers=options.headers;

		if (options.apiKey)
			this.headers.set("x-api-key",options.apiKey);
	}

	setApiKey(apiKey) {
		this.headers.set("x-api-key",apiKey);
	}

	setHeader(header, value) {
		this.headers.set(header,value);
	}

	async getCurrentUser() {
		console.log("getting current user...");

		let response=await this.fetch(urlJoin(this.url,"_getCurrentUser"));
		let reply=await response.json();

		return reply;
	}

	async findMany(table, query={}) {
		//console.log("table: ",table," query: ",query);

		/*if (query.id && !query.id.length)
			throw new Error("no query for you");*/

		let url=urlJoin(this.url,table)+"?filter="+JSON.stringify(query);
		let resultsResponse=await this.fetch(url,{
			headers: this.headers
		});
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
				referer: referer.toString(),
			})
		});
		return await response.json();
	}

	async insert(tableName, data) {
		let h=new Headers(this.headers);
		h.set("content-type","application/json");

		let response=await this.fetch(urlJoin(this.url,tableName),{
			method: "POST",
			body: JSON.stringify(data),
			headers: h
		});

		if (response.status!=200)
			throw new Error(await response.text());

		return await response.json();
	}

	async update(tableName, id, data) {
		let h=new Headers(this.headers);
		h.set("content-type","application/json");

		let response=await this.fetch(urlJoin(this.url,tableName,String(id)),{
			method: "PUT",
			body: JSON.stringify(data),
			headers: h
		});

		if (response.status!=200)
			throw new Error(await response.text());

		return await response.json();
	}

	async delete(tableName, id) {
		let response=await this.fetch(urlJoin(this.url,tableName,String(id)),{
			method: "DELETE",
			headers: new Headers(this.headers)
		});

		if (response.status!=200)
			throw new Error(await response.text());

		return await response.json();
	}

	async uploadFile(file) {
        let formData=new FormData();
        formData.append("file",file);

        let uploadResponse=await fetch(urlJoin(this.url,"_upload"),{
        	method: "post",
        	body: formData,
			headers: new Headers(this.headers)
        });

        if (uploadResponse.status<200 || uploadResponse.status>=300)
        	throw new Error(await uploadResponse.text());

        let uploadResult=await uploadResponse.json();
        return uploadResult.file;
	}
}
