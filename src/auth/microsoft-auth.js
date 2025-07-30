import OAuthClient from "../utils/OAuthClient.js";

export class MicrosoftAuth {
	constructor(server) {
		this.server=server;
	}

    createOAuthClient() {
        return new OAuthClient({
            clientId: this.server.conf.microsoftClientId,
            clientSecret: this.server.conf.microsoftClientSecret,
            installUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            scope: "https://graph.microsoft.com/user.read offline_access"
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

        let response=await fetch("https://graph.microsoft.com/v1.0/me",{
            headers: {
                "authorization": "Bearer "+token.access_token
            }
        });

        if (response.status!=200)
            throw new Error(await response.text());

        let tokenInfo=await response.json();

        //console.log("got token info: ",tokenInfo);
        return tokenInfo; //.mail;
	}
}

export function microsoftAuthDriver(server) {
	if (server.conf.microsoftClientId && server.conf.microsoftClientSecret) {
		//console.log("Initializing Microsoft Auth...");
		server.authMethods.microsoft=new MicrosoftAuth(server);
	}
}
