import OAuthClient from "../utils/OAuthClient.js";

/*function auth (username, password) {
    return 'Basic ' + btoa(username + ':' + password)
}*/

export class GoogleAuth {
	constructor(server) {
		this.server=server;
	}

    createOAuthClient() {
        return new OAuthClient({
            clientId: this.server.conf.googleClientId,
            clientSecret: this.server.conf.googleClientSecret,
            installUrl: "https://accounts.google.com/o/oauth2/auth",
            tokenUrl: "https://oauth2.googleapis.com/token",
            scope: "https://www.googleapis.com/auth/userinfo.email"
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

        let infoUrl=new URL("https://oauth2.googleapis.com/tokeninfo");
        infoUrl.searchParams.set("id_token",token.id_token);

        let infoResponse=await fetch(infoUrl.toString());
        let tokenInfo=await infoResponse.json();

        return tokenInfo.email;
	}
}

export function googleAuthDriver(server) {
	if (server.conf.googleClientId && server.conf.googleClientSecret) {
		server.authMethods.google=new GoogleAuth(server);
	}
}
