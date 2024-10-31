import path from "path-browserify";

export class FsStorage {
	constructor(storagePath, {fs}) {
		this.fs=fs;
		this.storagePath=storagePath;
	}

	async putFile(name, f) {
		if (!this.fs.existsSync(this.storagePath)) {
			console.log("Creating storage path: "+this.storagePath);
			await this.fs.promises.mkdir(this.storagePath,{recursive: true});
		}

		let target=path.join(this.storagePath,name);
        await this.fs.promises.writeFile(target,new Uint8Array(await f.arrayBuffer()));
	}

	async getResponse(pathname) {
		//console.log("getting fs storage response for: "+pathname);

		let fn=path.join(this.storagePath,pathname);
		let data=await this.fs.promises.readFile(fn);//,"blob");

		let contentType="text/plain";
		let mimeTypesByExt={
			".png": "image/png",
			".jpg": "image/jpg"
		};

		if (mimeTypesByExt[path.extname(pathname)])
			contentType=mimeTypesByExt[path.extname(pathname)];

		// todo: respond with correct mime type
		return new Response(data,{
			headers: {
				"content-type": contentType
			}
		});
	}

	async listFiles() {
		if (!this.fs.existsSync(this.storagePath))
			return [];

		return await this.fs.promises.readdir(this.storagePath);
	}

	async deleteFile(name) {
		await this.fs.promises.unlink(path.join(this.storagePath,name));
	}
}

export function fsStorageDriver(server) {
	if (!server.isStorageUsed())
		return;

	let upload=server.conf.upload;
	if (!upload)
		throw new Error("Need defined upload path.");
		//upload="upload";

	server.storage=new FsStorage(upload,{fs: server.conf.fs});
}

export default fsStorageDriver;
