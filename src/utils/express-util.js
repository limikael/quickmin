export function removeDoubleSlashMiddleware() {
	return ((req,res,next)=>{
		let urlSplit=req.url.split("?");
		let urlReplaced=urlSplit[0].replace(/\/+/g,"/");
		req.url=[urlReplaced,...urlSplit.slice(1)].join("?");

		//console.log("u: "+req.url);

		next();
	});
}