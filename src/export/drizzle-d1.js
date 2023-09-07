import {drizzle} from "drizzle-orm/d1";
import DrizzleDb from "../db/DrizzleDb.js";

export function configureDrizzleD1(conf) {
	conf.dbFactory=(conf)=>{
		conf.drizzle=drizzle(conf.env[conf.d1Binding]);
		return new DrizzleDb(conf);
	}
}

export default configureDrizzleD1;