import Database from "better-sqlite3";
import {drizzle} from "drizzle-orm/better-sqlite3";
import DrizzleDb from "../db/DrizzleDb.js";

export function configureDrizzleSqlite(conf) {
	conf.dbFactory=(conf)=>{
        let dsnUrl=new URL(conf.dsn);
        if (dsnUrl.protocol!="sqlite:")
            throw new Error("Only sqlite supported with drizzle");

		conf.drizzle=drizzle(new Database(dsnUrl.pathname));
		return new DrizzleDb(conf);
	}
}

export default configureDrizzleSqlite;