function auth (username, password) {
    return 'Basic ' + btoa(username + ':' + password)
}

export class GoogleAuth {
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

	async getLoginUrl(reurl, state) {
        let u=new URL("https://accounts.google.com/o/oauth2/auth");
        u.searchParams.set("client_id",this.server.conf.googleClientId);
        u.searchParams.set("response_type","code");
        //u.searchParams.set("state","google");
        u.searchParams.set("state",state);
        u.searchParams.set("scope","https://www.googleapis.com/auth/userinfo.email");
        u.searchParams.set("prompt","select_account");
        u.searchParams.set("redirect_uri",reurl);

        let authUrl=u.toString();

        //console.log("google login url: "+authUrl);
        return authUrl;
	}

	async process(url, redirect_uri) {
        let u=new URL(url);
        let code=u.searchParams.get("code");

        //let redirect_uri=u.origin+u.pathname;

        //console.log("redirect_uri: "+redirect_uri);

        let headers=new Headers();
        headers.set("accept","application/json");
        headers.set("content-type","application/x-www-form-urlencoded");
        headers.set("authorization",auth(
            this.server.conf.googleClientId,
            this.server.conf.googleClientSecret
        ));

        let bodyParams=new URLSearchParams();
        bodyParams.set("code",code);
        bodyParams.set("grant_type","authorization_code");
        bodyParams.set("redirect_uri",redirect_uri);

        let fetchUrl="https://oauth2.googleapis.com/token";
        let fetchOptions={
            method: "POST",
            headers: headers,
            body: bodyParams.toString()
        };

        let tokenResponse=await fetch(fetchUrl,fetchOptions);
        let tokenBody=await tokenResponse.json();

        let infoUrl=new URL("https://oauth2.googleapis.com/tokeninfo");
        infoUrl.searchParams.set("id_token",tokenBody.id_token);

        let infoResponse=await fetch(infoUrl.toString());
        let tokenInfo=await infoResponse.json();

        return tokenInfo.email;
	}
}

export function googleAuthDriver(server) {
	if (server.conf.googleClientId && server.conf.googleClientSecret) {
		//console.log("Initializing Google Auth...");
		server.authMethods.google=new GoogleAuth(server);
	}
}
