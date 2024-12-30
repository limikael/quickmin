import {spawn} from "child_process";

export async function checkDeclaredError(fn) {
	let res;
	try {
		res=await fn();
	}

	catch (e) {
	    if (e.declared)
	        console.log("\n**** ERROR ***\n"+e.message+"\n");

	    else
	        console.log(e);

	    process.exit();
	}

	return res;
}

export async function runCommand(command, args=[], options={}) {
	const child=spawn(command, args, options);
	let out="";

	await new Promise((resolve,reject)=>{
		if (child.stdout) {
			child.stdout.on('data', (data) => {
				if (options.passthrough)
					process.stdout.write(data);

				out+=data;
			});
		}

		if (child.stderr) {
			child.stderr.on('data', (data) => {
				if (options.passthrough)
					process.stderr.write(data);

				else
					console.log(`stderr: ${data}`);
			});
		}

		child.on("error",(e)=>{
			reject(e);
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
