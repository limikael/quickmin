import path from "path";
import fs from "fs";

export class NodeStorage {
	constructor(storagePath) {
		if (!fs.existsSync(storagePath)) {
			console.log("Creating storage path: "+storagePath);
			fs.mkdirSync(storagePath);
		}

		this.storagePath=storagePath;
	}

	async putFile(name, f) {
		let target=path.join(this.storagePath,name);
		let data=Buffer.from(await f.arrayBuffer());
        fs.writeFileSync(target,data);
	}

	async getResponse(pathname) {
		let fn=path.join(this.storagePath,pathname);
		let data=fs.readFileSync(fn);

		return new Response(data);
	}

	async listFiles() {
		return fs.readdirSync(this.storagePath);
	}

	async deleteFile(name) {
		fs.unlinkSync(path.join(this.storagePath,name));
	}
}

export function nodeStorageDriver(server) {
	if (!server.isStorageUsed())
		return;

	let upload=server.conf.upload;
	if (!upload)
		upload="upload";

	server.storage=new NodeStorage(upload);
}

export default nodeStorageDriver;
