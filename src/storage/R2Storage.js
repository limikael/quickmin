export default class R2Storage {
	constructor(conf) {
		Object.assign(this,conf);
		console.log("Using R2: "+conf.r2Binding);
	}

	async putFile(f) {
		//console.log("Uploading to R2: "+f.name);
		let object=await this.env[this.r2Binding].put(f.name,await f.arrayBuffer());
		//console.log("Upload res: ",object);
	}

	async getResponse(key) {
		const object = await this.env[this.r2Binding].get(key);

        if (object === null) {
          return new Response('Object Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, {
          headers,
        });
	}
}