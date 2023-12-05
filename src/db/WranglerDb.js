import {spawn} from "child_process";

async function runCommand(command, args) {
	const child=spawn(command, args);
	let out="";

	await new Promise((resolve,reject)=>{
		child.stdout.on('data', (data) => {
			out+=data;
		});

		child.stderr.on('data', (data) => {
			console.log(`stderr: ${data}`);
		});

		child.on('close', (code) => {
			if (code) {
				console.log(out);
				return reject(new Error(command+" exit code: "+code))
			}

			resolve();
		});
	});

	return out;
}

export default class WranglerDb {
	constructor(binding, local) {
		console.log("Running wrangler on: "+binding+", local="+local);
		this.binding=binding;
		this.local=local;
	}

	runQueries=async (queries)=>{
		let sql=queries.join(";");
    	let args=["d1","execute",this.binding,"--json","--command",sql];
    	if (this.local)
    		args.push("--local")

		let out=await runCommand("wrangler",args);
		let responses=JSON.parse(out);

		let results=[];
		for (let response of responses) {
			if (!response.success)
				throw new Error("Query failed");

			results.push(response.results)
		}

		return results;
    }

    runSql=async (sql, ...params)=> {
    	return this.getSql(sql);
    }

    hasTransactionSupport() {
        return false;
    }
}