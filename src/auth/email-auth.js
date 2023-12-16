import OAuthClient from "../utils/OAuthClient.js";

export class EmailAuth {
	constructor(server) {
		this.server=server;
	}
}

export function emailAuthDriver(server) {
	server.authMethods.email=new EmailAuth(server);
}
