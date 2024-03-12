import sqlite3 from "sqlite3";
import {qqlDriverSqlite} from "qql";

export function quickminSqliteDriver(server) {
    if (!server.conf.dsn)
        server.conf.dsn="sqlite:quickmin.db";

    let dsnUrl=new URL(server.conf.dsn);
    if (dsnUrl.protocol!="sqlite:")
        throw new Error("Only sqlite supported with this driver");

    server.qqlDriver=qqlDriverSqlite(new sqlite3.Database(dsnUrl.pathname));
}

export default quickminSqliteDriver;