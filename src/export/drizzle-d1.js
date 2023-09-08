import {drizzle} from "drizzle-orm/d1";
import DrizzleDb from "../db/DrizzleDb.js";

export function drizzleD1Driver(server, driverOptions) {
	server.drizzle=drizzle(driverOptions.env[server.getConf("Database").d1]);
	server.db=new DrizzleDb(server);
}

export default drizzleD1Driver;