export function getRequestOrigin(req) {
	let protocol="http";
	if (req.headers["x-forwarded-proto"])
		protocol=req.headers["x-forwarded-proto"].split(",")[0];

	return protocol+"://"+req.headers.host;
}

export function getRequestOpts(req) {
	//console.log(getRequestOrigin(req));

	let url=new URL(req.url,getRequestOrigin(req));
	let opts=Object.fromEntries(url.searchParams);

	//console.log(url.pathname);
	opts._=url.pathname.split("/").filter(s=>s.length>0);

	return opts;
}

export async function fetchEx(url, options={}) {
	if (options.query) {
		url=new URL(url);
		url.search=new URLSearchParams(options.query).toString();
	}

	let result=await fetch(url,options);

	switch (options.dataType) {
		case "json":
			result.data=await result.json();
			break;

		case "text":
			result.data=await result.text();
			break;
	}

	return result;
}
