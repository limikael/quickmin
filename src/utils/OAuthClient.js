import {searchParamsFromObject} from "./js-util.js";
import urlJoin from "url-join";

export default class OAuthClient {
	constructor({clientId, clientSecret, installUrl, tokenUrl, scope, refreshEnabled}) {
		this.clientId=clientId;
		this.clientSecret=clientSecret;
		this.installUrl=installUrl;
		this.tokenUrl=tokenUrl;
		this.scope=scope;

		this.refreshEnabled=refreshEnabled;
	}

	getInstallUrl({scope, redirectUrl, state}) {
		let u=new URL(this.installUrl);

		u.searchParams.set("client_id",this.clientId);
		u.searchParams.set("redirect_uri",redirectUrl);
		u.searchParams.set("state",state);
		u.searchParams.set("access_type","offline");
        u.searchParams.set("prompt","consent");
		u.searchParams.set("response_type","code");

		if (this.scope)
			u.searchParams.set("scope",this.scope);

		if (scope)
			u.searchParams.set("scope",scope);

		return u.toString();
	}

	async initToken({redirectUrl, scope}) {
	    let u=new URL(redirectUrl);
	    let code=u.searchParams.get("code");

	    if (!code)
	        throw new Error("Got no code");

	    const authCodeProof = {
	        grant_type: 'authorization_code',
	        client_id: this.clientId,
	        client_secret: this.clientSecret,
	        redirect_uri: urlJoin(u.origin,u.pathname),
	        code: code
	    };

	    let response=await fetch(this.tokenUrl,{
	        method: 'POST',
	        body: searchParamsFromObject(authCodeProof),
	        headers: {
	            'content-type': 'application/x-www-form-urlencoded; charset=utf-8'
	        }
	    });

	    if (response.status!=200) {
	    	console.log("bad oauth response: "+await response.text());
	    	throw new Error("got bad response status: "+response.status);
	    }

	    let result=await response.json();
	    //console.log("token init result: ",result);
	    if (!result.access_token)
	    	throw new Error("Got no access token on oauth init");

	    if (this.refreshEnabled && !result.refresh_token)
	    	throw new Error("Got no refresh token on oauth init");

	    return result;
	}

	async refreshToken(refreshToken) {
		if (!this.refreshEnabled)
			throw new Error("Refresh not enabled for oauth client");

	    const authCodeProof = {
	        grant_type: 'refresh_token',
	        client_id: this.clientId,
	        client_secret: this.clientSecret,
	        refresh_token: refreshToken,
	    };

	    let response=await fetch(this.tokenUrl,{
	        method: 'POST',
	        body: searchParamsFromObject(authCodeProof),
	        headers: {
	            'content-type': 'application/x-www-form-urlencoded; charset=utf-8'
	        }
	    });

	    if (response.status!=200)
	        throw new Error("bad response status: "+response.status);

	    let result=await response.json();
	    if (!result.access_token)
	    	throw new Error("Got no access token on oauth refresh");

	    if (!result.refresh_token)
	    	throw new Error("Got no refresh token on oauth refresh");

	    return result;
	}
}