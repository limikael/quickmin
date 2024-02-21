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
