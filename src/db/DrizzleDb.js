import {sqliteTable, text, integer, real} from 'drizzle-orm/sqlite-core';
import {and, asc, desc, eq, or, inArray, sql, like} from 'drizzle-orm';

let DRIZZLE_TYPES={
    "text": text,
    "date": text,
    "datetime": text,
    "integer": integer,
    "real": real
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
            let operand=query[k];
            let op;
            if ("~".includes(k.slice(-1))) {
                op=k.slice(-1);
                k=k.slice(0,-1);
            }

            if (!this.tables[modelName][k])
                throw new Error("No such column for where: "+k);

            if (op=="~")
                parts.push(like(
                    this.tables[modelName][k],
                    "%"+operand.replace("%","\\%")+"%"
                ));

            else if (Array.isArray(query[k]))
                parts.push(inArray(this.tables[modelName][k],query[k]))

            else
                parts.push(eq(this.tables[modelName][k],query[k]))
        }

        return and(...parts);
    }

    async findMany(modelName, query={}, options={}) {
        //console.log("DB: findMany: "+modelName);

        let countRes=await this.drizzle
            .select({count: sql`count(*)`})
            .from(this.tables[modelName])
            .where(this.buildWhere(modelName,query))
            .get();

        options.count=countRes.count;

        let q=this.drizzle
            .select()
            .from(this.tables[modelName])
            .where(this.buildWhere(modelName,query));

        if (options.range) {
            q.offset(options.range[0]);
            q.limit(options.range[1]-options.range[0]+1);
        }

        else {
            options.range=[0,options.count-1];
        }

        if (options.sort) {
            if (options.sort.length!=2)
                throw new Error("Expected sort to contain 2 items");

            let sortField=this.tables[modelName][options.sort[0]];
            switch (options.sort[1].toUpperCase()) {
                case "ASC":
                    q.orderBy(asc(sortField));
                    break;

                case "DESC":
                    q.orderBy(desc(sortField));
                    break;

                default:
                    throw new Error("Unknown sort direction: "+options.sort[1]);
            }
        }

        return await q.all();
    }

    async findOne(modelName, query={}) {
        //console.log("DB: findOne: "+modelName);

        return await this.drizzle
            .select()
            .from(this.tables[modelName])
            .where(this.buildWhere(modelName,query))
            .get();
    }

    async insert(modelName, data) {
        //console.log("insert",modelName,data);
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