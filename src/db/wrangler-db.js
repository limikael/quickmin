import {runCommand} from "../utils/node-util.js";
import {QqlDriverBase} from "qql";

export class WranglerQqlDriver extends QqlDriverBase {
	constructor({d1Binding, local, remote, wranglerJsonPath, wranglerBin, wranglerEnv}) {
		super({escapeFlavor: "sqlite"});

		if (!d1Binding)
			d1Binding="DB";

		if (!local && !remote)
			throw new Error("Local or remote instance not specified");

		if (!wranglerBin)
			wranglerBin="wrangler";

		if (!wranglerEnv)
			wranglerEnv=process.env;

		this.wranglerBin=wranglerBin;
		this.wranglerEnv=wranglerEnv;
		this.wranglerJsonPath=wranglerJsonPath;
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
    	let args=[];
    	if (this.wranglerJsonPath)
    		args.push("--config",this.wranglerJsonPath);

    	args.push("d1","execute",this.d1Binding,"--json","--command",sql);
    	if (this.local)
    		args.push("--local")

    	if (this.remote)
    		args.push("--remote")

    	//console.log("wrangler db:",args);
    	//process.exit();

		let out=await runCommand(this.wranglerBin,args,{
			env: this.wranglerEnv
		});
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
		//wranglerJsonPath: server.conf.wranglerJsonPath,
		remote: true
	});

	server.qqlDriver=wranglerQqlDriver;
}

export function wranglerDbLocal(server) {
	let wranglerQqlDriver=new WranglerQqlDriver({
		d1Binding: server.conf.d1Binding,
		//wranglerJsonPath: server.conf.wranglerJsonPath,
		local: true
	});

	server.qqlDriver=wranglerQqlDriver;
}
