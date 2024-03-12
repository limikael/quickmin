class D1QqlDriver {
	constructor(d1) {
		this.d1=d1;
	}

	async singleQuery(query, returnType) {
		let qr;
		switch (returnType) {
			case "rows":
				qr=await this.d1.prepare(query).all();
				if (!qr.success)
					throw new Error("Query failed");
				return qr.results;
				break;

			case "id":
				qr=await this.d1.prepare(query).run();
				if (!qr.success)
					throw new Error("Query failed");
				return qr.meta.last_row_id;
				break;

			case "changes":
				qr=await this.d1.prepare(query).run();
				if (!qr.success)
					throw new Error("Query failed");
				return qr.meta.changes;
				break;

			case "none":
				qr=await this.d1.prepare(query).run();
				if (!qr.success)
					throw new Error("Query failed");
				return;
				break;

			default:
				throw new Error("Unknown query return type: "+returnType);
		}
	}

	queries=async(queries, returnType)=>{
		let res=[];

		for (let query of queries)
			res.push(await this.singleQuery(query, returnType))

		return res;
	}
}

export function quickminD1Driver(server) {
	let d1Binding=server.conf.d1Binding;
	if (!d1Binding)
		d1Binding="DB";

	let d1=server.conf.env[d1Binding];
	if (!d1)
		throw new Error("Binding not found in env: "+d1Binding);

	let d1Driver=new D1QqlDriver(d1);
	server.qqlDriver=d1Driver.queries;
}

export default quickminD1Driver;