export default class R2Storage {
    constructor(r2) {
        this.r2=r2;
    }

    async putFile(name, f) {
        let arrayBuffer=await f.arrayBuffer();
        let object=await this.r2.put(name,arrayBuffer);
    }

    async getResponse(key, req) {
        let options={};
        if (req.headers.get("if-none-match"))
            options.onlyIf={
                etagDoesNotMatch: req.headers.get("if-none-match").replaceAll('"',"")
            }

        const object=await this.r2.get(key,options);

        if (object === null) {
            return new Response('Object Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        //headers.set('etag', object.httpEtag.replaceAll('"',""));
        headers.set('etag', object.httpEtag);

        if (!object.body)
            return new Response(null,{
                headers,
                status: 304
            });

        return new Response(object.body, {
            headers,
        });
    }

    async listFiles() {
        let list=await this.r2.list();
        let objects=list.objects;

        while (list.truncated) {
            list=await this.r2.list({cursor: list.cursor});
            objects.push(...list.objects);
        }

        return objects.map(o=>o.key);
    }

    async deleteFile(fn) {
        await this.r2.delete(fn);
    }
}