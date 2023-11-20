export function splitPath(pathname) {
	if (pathname===undefined)
		throw new Error("Undefined pathname");

	return pathname.split("/").filter(s=>s.length>0);
}

export function jsonEq(a,b) {
	return (JSON.stringify(a)==JSON.stringify(b));
}

export function jsonClone(o) {
	return JSON.parse(JSON.stringify(o));
}

export function getFileExt(fn) {
	if (fn.lastIndexOf(".")<0)
		throw new Error("Filename doesn't contain a dot.");

	return fn.slice(fn.lastIndexOf("."));
}

export async function fetchEx(url, options={}) {
	if (options.query) {
		url=new URL(url);
		url.search=new URLSearchParams(options.query).toString();
	}

	let result=await fetch(url,options);
	if (result.status<200 || result.status>=300)
		throw new Error(await result.text());

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

export function makeNameFromSymbol(symbol) {
    symbol=symbol.replaceAll("_"," ");
    symbol=symbol.charAt(0).toUpperCase()+symbol.slice(1);

    return symbol;
}

export function parseCookie(str) {
	return (
	  	str
		    .split(';')
		    .map(v => v.split('='))
		    .reduce((acc, v) => {
		    	if (v.length==2)
					acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());

				return acc;
		    }, {})
	)
}

export function arrayOnlyUnique(a) {
	function onlyUnique(value, index, array) {
		return array.indexOf(value) === index;
	}

	return a.filter(onlyUnique);
}