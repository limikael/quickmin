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

export function netTry(res, fn) {
	fn().catch(e=>{
		res.status(500);
		if (e instanceof Error) {
			console.error(e);
			res.json({
				message: e.message,
				stack: e.stack
			});
		}

		else
			res.end(e);
	});
}

export function trimChar(string, charToRemove) {
	if (!string)
		return "";

    while(string.charAt(0)==charToRemove) {
        string = string.substring(1);
    }

    while(string.charAt(string.length-1)==charToRemove) {
        string = string.substring(0,string.length-1);
    }

    return string;
}