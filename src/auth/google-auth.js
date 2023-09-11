import ClientOAuth2 from "client-oauth2";

// should probably use: https://www.npmjs.com/package/simple-oauth2

export default class GoogleAuth {
	constructor(server) {
		this.server=server;
	}

    createGoogleAuthClient(redirectUri) {
        return new ClientOAuth2({
            clientId: this.server.conf.googleClientId,
            clientSecret: this.server.conf.googleClientSecret,
            accessTokenUri: 'https://oauth2.googleapis.com/token',
            authorizationUri: 'https://accounts.google.com/o/oauth2/auth',
            redirectUri: redirectUri,
            scopes: ['https://www.googleapis.com/auth/userinfo.email']
        });
    }

	async getLoginUrl(reurl) {
        let authUrl=await this.createGoogleAuthClient(reurl).code.getUri({
            state: "google"
        });
        authUrl+="&prompt=select_account";

        return authUrl;
	}

	async process(reurl, url) {
        let res=await this.createGoogleAuthClient(reurl).code.getToken(url);
        let apiUrl="https://oauth2.googleapis.com/tokeninfo?"+new URLSearchParams({
            id_token: res.data.id_token
        });

        let response=await fetch(apiUrl);
        let tokenInfo=await response.json();

        return tokenInfo.email;
	}
}

export function googleAuthDriver(server) {
	if (server.conf.googleClientId && server.conf.googleClientSecret) {
		console.log("Initializing Google Auth...");
		server.authMethods.google=new GoogleAuth(server);
	}
}