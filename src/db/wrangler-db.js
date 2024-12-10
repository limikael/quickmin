import {runCommand} from "../utils/node-util.js";
import {QqlDriverBase} from "qql";

class WranglerQqlDriver extends QqlDriverBase {
	constructor({d1Binding, local, remote}) {
		super({escapeFlavor: "sqlite"});

		if (!d1Binding)
			d1Binding="DB";

		this.d1Binding=d1Binding;
		this.local=local;
		this.remote=remote;
	}

	query=async(query, params, returnType)=>{
		if (params.length)
			throw new Error("params not supported by wrangler driver");

		let queriesRes=await this.queries([query],returnType);
		return queriesRes[0];
	}

	queries=async(queries, returnType)=>{
		if (!["rows","none"].includes(returnType))
			throw new Error("Only rows and none supported as return type.");

		let sql=queries.join(";");
    	let args=["d1","execute",this.d1Binding,"--json","--command",sql];
    	if (this.local)
    		args.push("--local")

    	if (this.remote)
    		args.push("--remote")

    	//console.log("wrangler",args);
    	//process.exit();

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

export function wranglerDbRemote(server) {
	let wranglerQqlDriver=new WranglerQqlDriver({
		d1Binding: server.conf.d1Binding,
		remote: true
	});

	server.qqlDriver=wranglerQqlDriver;
}

export function wranglerDbLocal(server) {
	let wranglerQqlDriver=new WranglerQqlDriver({
		d1Binding: server.conf.d1Binding,
		local: true
	});

	server.qqlDriver=wranglerQqlDriver;
}
