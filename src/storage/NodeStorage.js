import path from "path";
import fs from "fs";

export default class NodeStorage {
	constructor(conf) {
		Object.assign(this,conf);
	}

	async putFile(f) {
		let target=path.join(this.storagePath,f.name);
		let data=Buffer.from(await f.arrayBuffer());
        fs.writeFileSync(target,data);
	}

	async getResponse(pathname) {
		let fn=path.join(this.storagePath,pathname);
		let data=fs.readFileSync(fn);

		return new Response(data);
	}
}