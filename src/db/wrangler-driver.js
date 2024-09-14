import {runCommand} from "../utils/node-util.js";

class WranglerQqlDriver {
	constructor({d1Binding, local, remote}) {
		if (!d1Binding)
			d1Binding="DB";

		this.d1Binding=d1Binding;
		this.local=local;
		this.remote=remote;
	}

	queries=async(queries, returnType)=>{
		if (returnType!="rows")
			throw new Error("Only rows supported as return type.");

		let sql=queries.join(";");
    	let args=["d1","execute",this.d1Binding,"--json","--command",sql];
    	if (this.local)
    		args.push("--local")

    	if (this.remote)
    		args.push("--remote")

    	//console.log(args);
    	//console.log("wrangler",args);

		let out=await runCommand("wrangler",args);
		let responses=JSON.parse(out);

		let results=[];
		for (let response of responses) {
			if (!response.success)
				throw new Error("Query failed");

			results.push(response.results)
		}

		//console.log(results);

		return results;
	}
}

export function wranglerDb(server) {
	let wranglerQqlDriver=new WranglerQqlDriver({
		d1Binding: server.conf.d1Binding,
		remote: true
	});

	server.qqlDriver=wranglerQqlDriver.queries;
}

export function wranglerDbLocal(server) {
	let wranglerQqlDriver=new WranglerQqlDriver({
		d1Binding: server.conf.d1Binding,
		local: true
	});

	server.qqlDriver=wranglerQqlDriver.queries;
}
