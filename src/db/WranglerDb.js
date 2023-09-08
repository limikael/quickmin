import {Sequelize, DataTypes} from "sequelize";
import {spawn} from "child_process";

export default class WranglerDb {
	constructor(binding, local) {
		console.log("Running wrangler on: "+binding+", local="+local);
		this.binding=binding;
		this.local=local;
	}

    getSql=async (sql, ...params)=>{
    	let args=["d1","execute",this.binding,"--json","--command",sql];
    	if (this.local)
    		args.push("--local")

		const wrangler=spawn('wrangler', args);
		let out="";

		await new Promise((resolve,reject)=>{
			wrangler.stdout.on('data', (data) => {
				out+=data;
			});

			wrangler.stderr.on('data', (data) => {
				console.log(`stderr: ${data}`);
			});

			wrangler.on('close', (code) => {
				if (code) {
					console.log("exit...");
					console.log(out);
					return reject(new Error("Wrangler exit code: "+code))
				}

				resolve();
			});
		});

		let response=JSON.parse(out);
		if (!response[0].success)
			throw new Error();

		return response[0].results;
    }

    runSql=async (sql, ...params)=> {
    	return this.getSql(sql);
    }
}