import QuickminServer from "../server/QuickminServer.js";
import {parse as parseYaml} from "yaml";

class WeakMemo {
	constructor(initializer) {
		this.map=new WeakMap();
	}

	async get(env, initializer) {
		if (!env)
			env=global;

		if (!this.map.get(env))
			this.map.set(env,initializer());

		return await this.map.get(env);
	}
}

export function quickmin(conf,drivers) {
	let quickminMemo=new WeakMemo();

	return async (c, next)=>{
		let quickmin=await quickminMemo.get(c.env,async()=>{
	       if (typeof conf=="string")
    	        conf=parseYaml(conf);

    	    conf={...conf,env: c.env};

			return new QuickminServer(conf,drivers);
		});

		let response=await quickmin.handleRequest(c.req.raw);
		if (response)
			return response;

		return await next();
	}
}

export default quickmin;