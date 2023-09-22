import TableSpec from "./TableSpec.js";

export default class DbMigrator {
	constructor({runQueries, tables, dryRun, force, transaction}) {
		this.runQueries=runQueries;
		this.dryRun=dryRun;
		this.force=force;
		this.transaction=transaction;

		this.tableSpecs={};
		for (let tableName in tables)
			this.tableSpecs[tableName]=new TableSpec(
				tableName,
				tables[tableName].fields,
				this
			);
	}

	async sync() {
		console.log("Getting existing schema, pass 1...");
		let nameRes=await this.runQueries(["SELECT name FROM sqlite_schema"]);
		let nameRows=nameRes[0];
		nameRows=nameRows.filter(row=>!row.name.startsWith("_cf"));
		//console.log(nameRows);

		console.log("Getting existing schema, pass 2...");
		let infoQueries=[];
		for (let nameRow of nameRows)
			infoQueries.push(`PRAGMA table_info (${nameRow.name})`)

		let infoRes=await this.runQueries(infoQueries);
		for (let i in nameRows) {
			let tableName=nameRows[i].name;
			if (this.tableSpecs[tableName])
				this.tableSpecs[tableName].processDescribeRows(infoRes[i]);
		}

		let queries=[
			"PRAGMA foreign_keys=OFF",
		];

		if (this.transaction)
			queries.push("BEGIN TRANSACTION");

		for (let tableName in this.tableSpecs)
			queries=[
				...queries,
				...this.tableSpecs[tableName].getSyncQueries(this.force)
			];

		if (this.transaction)
			queries.push("COMMIT");

		console.log(queries.join("\n"));

		if (!this.dryRun)
			await this.runQueries(queries);
	}

	log(s) {
		console.log(s);
	}
}