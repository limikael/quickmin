import Database from "better-sqlite3";
import {drizzle} from "drizzle-orm/better-sqlite3";
import DrizzleDb from "../db/DrizzleDb.js";

export function drizzleSqliteDriver(server) {
    let dsnUrl=new URL(server.getConf("Database").dsn);
    if (dsnUrl.protocol!="sqlite:")
        throw new Error("Only sqlite supported with drizzle");

	server.drizzle=drizzle(new Database(dsnUrl.pathname));
	server.db=new DrizzleDb(server);
}

export default drizzleSqliteDriver;