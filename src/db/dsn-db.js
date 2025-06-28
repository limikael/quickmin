import sqlite3 from "sqlite3";
//import BetterSqlite3Database from "better-sqlite3";
import {QqlDriverSqlite} from "qql";

export function dsnDb(server) {
    let dsnUrl=new URL(server.conf.dsn);

   switch (dsnUrl.protocol) {
        case "sqlite:":
            server.qqlDriver=new QqlDriverSqlite(new sqlite3.Database(dsnUrl.pathname));
            break;

        default:
            throw new DeclaredError("Unknown dsn: "+dsn);
    }
}