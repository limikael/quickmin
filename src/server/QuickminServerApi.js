import urlJoin from "url-join";

export default class QuickminServerApi {
	constructor(server) {
		this.server=server;
	}

	async findOne(table, query={}) {
		return await this.server.db.findOne(table,query);
	}

	async findMany(table, query={}) {
		return await this.server.db.findMany(table,query);
	}

	async update(table, query, data) {
		return await this.server.db.update(table,query,data);
	}

	async verifyAuthRedirectedUrl(redirectedUrl) {
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
	}
}