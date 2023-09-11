import {sqliteTable, text, integer} from 'drizzle-orm/sqlite-core';
import {and, asc, desc, eq, or} from 'drizzle-orm';

let DRIZZLE_TYPES={
    "text": text,
    "date": text,
    "datetime": text,
    "integer": integer
}

export default class DrizzleDb {
	constructor(server) {
        this.server=server;
        this.drizzle=server.drizzle;
        this.tables={};

        for (let c in this.server.collections) {
            let def={
                id: integer("id").primaryKey({autoIncrement: true})
            };

            for (let f in this.server.collections[c].fields) {
                let t=DRIZZLE_TYPES[this.server.collections[c].fields[f].sqlType];
                if (!t)
                    throw new Error("Type not supported in drizzle: "+this.server.collections[c].fields[f].sqlType);
                def[f]=t(f);
            }

            this.tables[c]=sqliteTable(c,def);
        }
	}

    async findMany(modelName, query={}) {
        let q=this.drizzle
            .select()
            .from(this.tables[modelName]);

        for (let k in query)
            q.where(eq(this.tables[modelName][k],query[k]))

        return await q.all();
    }

    async findOne(modelName, query={}) {
        let q=this.drizzle
            .select()
            .from(this.tables[modelName]);

        for (let k in query)
            q.where(eq(this.tables[modelName][k],query[k]))

        return await q.get();
    }

    async insert(modelName, data) {
        let insertResult=await this.drizzle
            .insert(this.tables[modelName])
            .values(data)
            .returning({inserted: this.tables[modelName]})
            .get();

        return insertResult.inserted;
    }

    async update(modelName, query, data) {
        let q=this.drizzle
            .update(this.tables[modelName])
            .set(data);

        for (let k in query)
            q.where(eq(this.tables[modelName][k],query[k]))

        let updateResult=await q
            .returning({updated: this.tables[modelName]})
            .get();

        return updateResult.updated;
    }

    async delete(modelName, query) {
        let q=this.drizzle
            .delete(this.tables[modelName]);

        for (let k in query)
            q.where(eq(this.tables[modelName][k],query[k]))

        let deleteResult=await q
            .returning({deleted: this.tables[modelName]})
            .get();

        return deleteResult.deleted;
    }

    isModel(modelName) {
        return this.tables.hasOwnProperty(modelName);
    }

    getSql=async (sql, ...params)=>{
        let res=await this.drizzle.session.client
            .prepare(sql)
            .bind(...params)
            .all();

        if (Array.isArray(res))
            return res;

        return res.results;
    }

    runSql=async (sql, ...params)=> {
        return await this.drizzle.session.client
            .prepare(sql)
            .run(...params);
    }
}