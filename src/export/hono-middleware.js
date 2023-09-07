import QuickminServer from "../server/QuickminServer.js";

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

export function quickmin(conf) {
	let quickminMemo=new WeakMemo();

	return async (c, next)=>{
		let quickmin=await quickminMemo.get(c.env,async()=>{
			return new QuickminServer({
				...conf,
				env: c.env,
			});
		});

		let response=await quickmin.handleRequest(c.req.raw);
		if (response)
			return response;

		return await next();
	}
}

export default quickmin;