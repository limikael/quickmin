import OAuthClient from "../utils/OAuthClient.js";

export class FacebookAuth {
	constructor(server) {
		this.server=server;
	}

    createOAuthClient() {
        return new OAuthClient({
            clientId: this.server.conf.facebookClientId,
            clientSecret: this.server.conf.facebookClientSecret,
            installUrl: "https://www.facebook.com/v18.0/dialog/oauth",
            tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
//            scope: "???"
        });
    }

	getLoginUrl(redirectUrl, state) {
        let client=this.createOAuthClient();

        return client.getInstallUrl({
            redirectUrl: redirectUrl,
            state: state
        });
	}

	async process(url) {
        let client=this.createOAuthClient();
        let token=await client.initToken({redirectUrl: url});

        console.log("got token from facebook: ",token);
        throw new Error("will process...");

        let response=await fetch("",{
            headers: {
                "authorization": "Bearer "+token.access_token
            }
        });

        if (response.status!=200)
            throw new Error(await response.text());

        let tokenInfo=await response.json();

        //console.log("got token info: ",tokenInfo);
        return tokenInfo.mail;
	}
}

export function facebookAuthDriver(server) {
	if (server.conf.facebookClientId && server.conf.facebookClientSecret) {
		//console.log("Initializing Facebook Auth...");
		server.authMethods.facebook=new FacebookAuth(server);
	}
}
