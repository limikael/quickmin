import {sqliteTable, text, integer} from 'drizzle-orm/sqlite-core';
import {and, asc, desc, eq, or} from 'drizzle-orm';

let DRIZZLE_TYPES={
    "text": text,
    "date": text,
    "datetime": text,
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

    async findMany(modelName) {
        return await this.drizzle
            .select()
            .from(this.tables[modelName])
            .all();
    }

    async findOne(modelName, query) {
        let q=this.drizzle
            .select()
            .from(this.tables[modelName]);

        for (let k in query)
            q.where(eq(this.tables[modelName][k],query[k]))

        return await q.get();

/*        return await this.drizzle
            .select()
            .from(this.tables[modelName])
            .where(eq(this.tables[modelName].id,id))
            .get();*/
    }

    async insert(modelName, data) {
        let insertResult=await this.drizzle
            .insert(this.tables[modelName])
            .values(data)
            .returning({inserted: this.tables[modelName]})
            .get();

        return insertResult.inserted;
    }

    async update(modelName, id, data) {
        let updateResult=await this.drizzle
            .update(this.tables[modelName])
            .set(data)
            .where(eq(this.tables[modelName].id,id))
            .returning({updated: this.tables[modelName]})
            .get();

        return updateResult.updated;
    }

    async delete(modelName, id) {
        let deleteResult=await this.drizzle
            .delete(this.tables[modelName])
            .where(eq(this.tables[modelName].id,id))
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