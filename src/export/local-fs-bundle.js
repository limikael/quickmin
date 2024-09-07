import urlJoin from "url-join";
import path from 'path-browserify';
import fs from "fs";

// requires fixing...
/*export function localFsBundle(server) {
	let p=["/"];
	if (server.conf.apiPath)
		p.push(server.conf.apiPath);

	p.push("_dist","quickmin-bundle.js");

	server.conf.bundleUrl=urlJoin(...p);

	server.distHandler=async (fn)=>{
		let absFn=path.join(__dirname,"../../dist",fn);
		let data=fs.readFileSync(absFn);

		let headers={};
		if (fn.endsWith(".js"))
			headers["content-type"]="text/javascript";

		return new Response(data,{headers: headers});
	}
}

export default localNodeBundle;*/