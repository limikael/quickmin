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

	processDescribeRows(rows) {
		this.existingSpecs={};

		for (let row of rows) {
			let fieldSpec=FieldSpec.fromSqliteDescribeRow(row);
			this.existingSpecs[fieldSpec.name]=fieldSpec;
		}
	}

	isCurrent() {
		if (!this.existingSpecs)
			return false;

		if (Object.keys(this.fieldSpecs).length
				!=Object.keys(this.existingSpecs).length)
			return false;

		for (let fieldName in this.fieldSpecs)
			if (!this.fieldSpecs[fieldName].equals(this.existingSpecs[fieldName]))
				return false;

		return true;
	}

	getRemovableColumns() {
		let existingFieldNames=Object.keys(this.existingSpecs);
		let fieldNames=Object.keys(this.fieldSpecs)
		let removable=[];
		//console.log("wanted,existing=",fieldNames,existingFieldNames)

		for (let existingName of existingFieldNames)
			if (!fieldNames.includes(existingName))
				removable.push(this.name+"/"+existingName);

		return removable;
	}

	getSyncQueries(force, test) {
		// If it doesn't exist, create.
		if (!this.existingSpecs) {
			this.migrator.log("[create]   "+this.name);
			return [this.createTable()];
		}

		// If up to date, don't do anything.
		if (this.isCurrent() && !force) {
			this.migrator.log("[current]  "+this.name);
			return [];
		}

		// Modify.
		let queries=[];

		this.migrator.log("[modify]   "+this.name);
		queries.push(this.createTable("_new"));

		let existingFieldNames=Object.keys(this.existingSpecs);
		let copyFields=Object.keys(this.fieldSpecs)
			.filter(fieldName=>existingFieldNames.includes(fieldName));

		if (copyFields.length) {
			let copyS=copyFields.join(",");
			let sq=`INSERT INTO \`${this.name+"_new"}\` (${copyS}) SELECT ${copyS} FROM \`${this.name}\``;
			queries.push(sq);
		}

		if (test) {
			queries.push(`DROP TABLE \`${this.name+"_new"}\``);
		}

		else {
			queries.push(`ALTER TABLE \`${this.name}\` RENAME TO \`${this.name+"_old"}\``);
			queries.push(`ALTER TABLE \`${this.name+"_new"}\` RENAME TO \`${this.name}\``);
			queries.push(`DROP TABLE \`${this.name+"_old"}\``);
		}

		return queries;
	}

	createTable(suffix="") {
		let parts=[];
		for (let fieldName in this.fieldSpecs) {
			parts.push(this.fieldSpecs[fieldName].getSql());
		}

		for (let fieldName in this.fieldSpecs) {
			let extraSql=this.fieldSpecs[fieldName].getExtraSql();
			if (extraSql)
				parts.push(extraSql);
		}

		return `CREATE TABLE \`${this.name+suffix}\` (${parts.join(",")})`;
	}
}