import {sqliteTable, text, integer} from 'drizzle-orm/sqlite-core';
import {and, asc, desc, eq, or} from 'drizzle-orm';

let DRIZZLE_TYPES={
    "text": text,
    "richtext": text,
    "date": text,
    "datetime": text,
    "select": text
}

export default class DrizzleDb {
	constructor(conf) {
		Object.assign(this,conf);

        this.tables={};

        for (let c in this.collections) {
            let def={
                id: integer("id").primaryKey({autoIncrement: true})
            };

            for (let f in this.collections[c].fields) {
                let t=DRIZZLE_TYPES[this.collections[c].fields[f].type];
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

    async findOne(modelName, id) {
        return await this.drizzle
            .select()
            .from(this.tables[modelName])
            .where(eq(this.tables[modelName].id,id))
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
}