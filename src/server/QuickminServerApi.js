import urlJoin from "url-join";
import {jwtSign} from "../utils/jwt-util.js";

export default class QuickminServerApi {
	constructor(server) {
		this.server=server;
	}

	async findOne(table, query={}) {
		return this.server.presentItem(
			table,
			await this.server.db.findOne(table,query)
		);
	}

	async findMany(table, query={}) {
		let items=await this.server.db.findMany(table,query);
		items=items.map(item=>this.server.presentItem(table, item));
		return items;
	}

	async update(table, id, data) {
		let updateResult=await this.server.db.update(
			table,
			{id: String(id)},
			this.server.representItem(table,data)
		);

		return this.server.presentItem(table,updateResult);
	}

	async insert(table, data) {
		let insertResult=await this.server.db.insert(
			table,
			this.server.representItem(table,data)
		);

		return this.server.presentItem(table,insertResult);
	}

	async delete(table, id) {
		let deleteResult=await this.server.db.delete(table,{id: String(id)});

		return this.server.presentItem(table,deleteResult);
	}

	async getUserByRequest(req) {
		return await this.server.getUserByRequest(req);
	}

	async getRoleByRequest(req) {
		return await this.server.getRoleByRequest(req);
	}

	async getTokenLoginUrl(redirect, provider, token) {
		let redirectUrl=new URL(redirect);

		let urlComps=[redirectUrl.origin];
		if (this.server.conf.apiPath)
			urlComps.push(this.server.conf.apiPath);

		urlComps.push("_tokenLogin");
		let url=new URL(urlJoin(...urlComps));

        let payload={
            provider: provider,
            token: token,
        };

        let jwtToken=jwtSign(payload,this.server.conf.jwtSecret);
        url.searchParams.set("token",jwtToken);
        url.searchParams.set("redirect",redirect);

		return url.toString();
	}

	/*async verifyAuthRedirectedUrl(redirectedUrl) {
		let url=new URL(redirectedUrl);
		let state=JSON.parse(url.searchParams.get("state"));

        let hostConf=this.server.getHostConf(url.hostname);
        if (hostConf.oauthHostname)
            url.hostname=hostConf.oauthHostname;

        let reurl=urlJoin(url.origin,this.server.conf.apiPath,"_oauthRedirect");
        let token=await this.server.authMethods[state.provider].process(redirectedUrl,reurl);

        if (!token)
        	throw new Error("Unable to perform auth");

        return {
        	...state,
        	token: token
        };
	}*/
}