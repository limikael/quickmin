import FieldSpec from "./FieldSpec.js";

export default class TableSpec {
	constructor(name, fields, migrator) {
		this.name=name;
		this.migrator=migrator;

		this.fieldSpecs={};
		for (let fieldName in fields)
			this.fieldSpecs[fieldName]=new FieldSpec({
				name: fieldName,
				...fields[fieldName]
			});
	}

	async describe() {
		/*let srows=await this.migrator.getSql("SELECT sql FROM sqlite_schema WHERE name=?",this.name);
		if (!srows.length)
			return undefined;*/

		let rows=await this.migrator.getSql(`PRAGMA TABLE_INFO (${this.name})`);

		let res={};
		for (let row of rows) {
			let fieldSpec=FieldSpec.fromSqliteDescribeRow(row);
			res[fieldSpec.name]=fieldSpec;
		}

		return res;
	}

	isCurrent(existingSpecs) {
		if (Object.keys(this.fieldSpecs).length
				!=Object.keys(existingSpecs).length)
			return false;

		for (let fieldName in this.fieldSpecs)
			if (!this.fieldSpecs[fieldName].equals(existingSpecs[fieldName]))
				return false;

		return true;
	}

	async sync() {
		let existingSpecs=await this.describe();

		// If it doesn't exist, create.
		if (!existingSpecs) {
			this.migrator.log("Create: "+this.name);
			await this.createTable();
			return;
		}

		// If up to date, don't do anything.
		if (this.isCurrent(existingSpecs)) {
			this.migrator.log("Current: "+this.name);
			return;
		}

		// Modify.
		this.migrator.log("Modify: "+this.name);
		await this.createTable("_new");

		let existingFieldNames=Object.keys(existingSpecs);
		let copyFields=Object.keys(this.fieldSpecs)
			.filter(fieldName=>existingFieldNames.includes(fieldName));

		if (copyFields.length) {
			let copyS=copyFields.join(",");
			let sq=`INSERT INTO ${this.name+"_new"} (${copyS}) SELECT ${copyS} FROM ${this.name}`;
			await this.migrator.runSql(sq);
		}

		await this.migrator.runSql(`ALTER TABLE ${this.name} RENAME TO ${this.name+"_old"}`);
		await this.migrator.runSql(`ALTER TABLE ${this.name+"_new"} RENAME TO ${this.name}`);
		await this.migrator.runSql(`DROP TABLE ${this.name+"_old"}`);
	}

	async createTable(suffix="") {
		let qs=`CREATE TABLE ${this.name+suffix} (`;

		let first=true;
		for (let fieldName in this.fieldSpecs) {
			if (!first)
				qs+=",";

			first=false;
			qs+=`\`${fieldName}\` ${this.fieldSpecs[fieldName].getSql()}`;
		}

		qs+=")";

		await this.migrator.runSql(qs);
	}
}