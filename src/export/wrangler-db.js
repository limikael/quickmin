import WranglerDb from "../db/WranglerDb.js";

export function wranglerDb(server) {
	server.db=new WranglerDb(server.conf.d1Binding,false);
}

export function wranglerDbLocal(server) {
	server.db=new WranglerDb(server.conf.d1Binding,true);
}
