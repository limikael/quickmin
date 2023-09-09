import {drizzle} from "drizzle-orm/d1";
import DrizzleDb from "../db/DrizzleDb.js";

export function drizzleD1Driver(server) {
	server.drizzle=drizzle(server.conf.env[server.conf.d1Binding]);
	server.db=new DrizzleDb(server);
}

export default drizzleD1Driver;