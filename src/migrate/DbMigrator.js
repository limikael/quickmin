import TableSpec from "./TableSpec.js";

export default class DbMigrator {
	constructor(spec) {
		Object.assign(this,spec);

		this.tableSpecs={};
		for (let tableName in this.tables)
			this.tableSpecs[tableName]=new TableSpec(
				tableName,
				this.tables[tableName],
				this
			);

		let runSql=this.runSql;
		this.runSql=async (query, ...params)=>{
			console.log("[query]    "+query);

			if (spec.dryRun)
				return;

			return await runSql(query, ...params);
		}
	}

	async sync() {
		for (let tableName in this.tableSpecs)
			await this.tableSpecs[tableName].sync();
	}

	log(s) {
		console.log(s);
	}
}