export default class R2Storage {
    constructor(conf) {
        Object.assign(this,conf);
        console.log("Using R2: "+conf.r2Binding);
    }

    async putFile(f) {
        let object=await this.env[this.r2Binding].put(f.name,await f.arrayBuffer());
    }

    async getResponse(key, req) {
        let options={};
        if (req.headers.get("if-none-match"))
            options.onlyIf={
                etagDoesNotMatch: req.headers.get("if-none-match").replaceAll('"',"")
            }

        let r2=this.env[this.r2Binding];
        const object=await r2.get(key,options);

        if (object === null) {
            return new Response('Object Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
//        headers.set('etag', object.httpEtag.replaceAll('"',""));
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
}