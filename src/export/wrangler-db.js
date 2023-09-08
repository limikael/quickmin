import WranglerDb from "../db/WranglerDb.js";

export function wranglerDb(server, options) {
	server.db=new WranglerDb(server.getConf("Database").d1,options.wranglerLocal);
}

export default wranglerDb;