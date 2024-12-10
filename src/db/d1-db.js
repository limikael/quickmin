import {QqlDriverBase} from "qql";

class D1QqlDriver extends QqlDriverBase {
	constructor(d1) {
		super({escapeFlavor: "sqlite"});

		this.d1=d1;
	}

	async query(query, params, returnType) {
		//console.log("d1 query",query,params);

		let qr;
		switch (returnType) {
			case "rows":
				qr=await this.d1.prepare(query).bind(...params).all();
				if (!qr.success)
					throw new Error("Query failed");
				return qr.results;
				break;

			case "id":
				qr=await this.d1.prepare(query).bind(...params).run();
				if (!qr.success)
					throw new Error("Query failed");
				return qr.meta.last_row_id;
				break;

			case "changes":
				qr=await this.d1.prepare(query).bind(...params).run();
				if (!qr.success)
					throw new Error("Query failed");
				return qr.meta.changes;
				break;

			case "none":
				qr=await this.d1.prepare(query).bind(...params).run();
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
			res.push(await this.query(query, [], returnType))

		return res;
	}
}

export function d1DbDriver(server) {
	let d1Binding=server.conf.d1Binding;
	if (!d1Binding)
		d1Binding="DB";

	let d1=server.conf.env[d1Binding];
	if (!d1)
		throw new Error("Binding not found in env: "+d1Binding);

	server.qqlDriver=new D1QqlDriver(d1);
}

export default d1DbDriver;