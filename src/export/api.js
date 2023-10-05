import urlJoin from "url-join";

export class QuickminApi {
	constructor(options={}) {
		this.fetch=fetch;
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

	async uploadFile(file) {
        let formData=new FormData();
        formData.append("file",file);

        let uploadResponse=await fetch(urlJoin(this.url,"_upload"),{
        	method: "post",
        	body: formData,
			headers: new Headers(this.headers)
        });
        let uploadResult=await uploadResponse.json();
        return uploadResult.file;
	}
}
