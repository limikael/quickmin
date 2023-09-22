import {sqliteTable, text, integer} from 'drizzle-orm/sqlite-core';
import {and, asc, desc, eq, or, inArray} from 'drizzle-orm';

let DRIZZLE_TYPES={
    "text": text,
    "date": text,
    "datetime": text,
    "integer": integer
}

export default class DrizzleDb {
	constructor(server, transactionSupport) {
        this.transactionSupport=transactionSupport;
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

    buildWhere(modelName, query) {
        let parts=[];
        for (let k in query) {
            if (Array.isArray(query[k]))
                parts.push(inArray(this.tables[modelName][k],query[k]))

            else
                parts.push(eq(this.tables[modelName][k],query[k]))
        }

        return and(...parts);
    }

    async findMany(modelName, query={}) {
        return await this.drizzle
            .select()
            .from(this.tables[modelName])
            .where(this.buildWhere(modelName,query))
            .all();
    }

    async findOne(modelName, query={}) {
        return await this.drizzle
            .select()
            .from(this.tables[modelName])
            .where(this.buildWhere(modelName,query))
            .get();
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
        let updateResult=await this.drizzle
            .update(this.tables[modelName])
            .set(data)
            .where(this.buildWhere(modelName,query))
            .returning({updated: this.tables[modelName]})
            .get();

        if (!updateResult)
            return;

        return updateResult.updated;
    }

    async delete(modelName, query) {
        let deleteResult=await this.drizzle
            .delete(this.tables[modelName])
            .where(this.buildWhere(modelName,query))
            .returning({deleted: this.tables[modelName]})
            .get();

        if (!deleteResult)
            return;

        return deleteResult.deleted;
    }

    isModel(modelName) {
        return this.tables.hasOwnProperty(modelName);
    }

    runQueries=async (queries)=>{
        let result=[];
        for (let query of queries) {
            let stmt=this.drizzle.session.client.prepare(query);

            if (stmt.reader)
                result.push(await stmt.all());

            else
                result.push(await stmt.run());
        }

        return result;
    }

    hasTransactionSupport() {
        return this.transactionSupport;
    }
}