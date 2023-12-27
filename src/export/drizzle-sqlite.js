import Database from "better-sqlite3";
import {drizzle} from "drizzle-orm/better-sqlite3";
import DrizzleDb from "../db/DrizzleDb.js";

export function drizzleSqliteDriver(server) {
    if (!server.conf.dsn)
        server.conf.dsn="sqlite:quickmin.db";

    let dsnUrl=new URL(server.conf.dsn);
    if (dsnUrl.protocol!="sqlite:")
        throw new Error("Only sqlite supported with drizzle");

    server.databaseConnection=new Database(dsnUrl.pathname);
	server.drizzle=drizzle(server.databaseConnection);
	server.db=new DrizzleDb(server,true);
}

export default drizzleSqliteDriver;