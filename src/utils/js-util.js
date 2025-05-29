export class ResolvablePromise extends Promise {
	constructor(cb = () => {}) {
        let resolveClosure = null;
        let rejectClosure = null;

		super((resolve,reject)=>{
            resolveClosure = resolve;
            rejectClosure = reject;

			return cb(resolve, reject);
		});

        this.resolveClosure = resolveClosure;
        this.rejectClosure = rejectClosure;
 	}

	resolve=(result)=>{
		this.resolveClosure(result);
	}

	reject=(reason)=>{
		this.rejectClosure(reason);
	}
}

export function splitPath(pathname) {
	if (pathname===undefined)
		throw new Error("Undefined pathname");

	return pathname.split("/").filter(s=>s.length>0);
}

export function urlGetArgs(url) {
	return splitPath(new URL(url).pathname);
}

export function urlGetParams(urlString,{afterHash}={}) {
	let url=new URL(urlString);
	let afterHashParams;

	if (afterHash && url.toString().includes("#")) {
        let [hash, query]=url.toString().split('#')[1].split('?');
        afterHashParams=Object.fromEntries(new URLSearchParams(query));
	}

	return ({...Object.fromEntries(url.searchParams),...afterHashParams});
}

export function jsonEq(a,b) {
	return (JSON.stringify(a)==JSON.stringify(b));
}

export function jsonClone(o) {
	if (o===undefined)
		return o;

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
	symbol=symbol.replaceAll("_"," ").replaceAll("-"," ");
	symbol=symbol
		.split(" ")
		.map(s=>s.trim().charAt(0).toUpperCase()+s.trim().slice(1))
		.join(" ");

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

export function arrayDifference(a, b) {
	return a.filter(item=>!b.includes(item));	
}

export function arrayIntersection(a, b) {
	return a.filter(item=>b.includes(item));
}

export function arrayify(cand) {
    if (!cand)
        return [];

    if (!Array.isArray(cand))
        return [cand];

    return cand;
}

export function searchParamsFromObject(o) {
    let searchParams=new URLSearchParams();
    for (let k in o)
        searchParams.set(k,o[k]);

    return searchParams;
}

export class DeclaredError extends Error {
	constructor(...args) {
		super(...args);
		this.declared=true;
	}
}

export function objectRemoveUnknown(o, known) {
	let res={};
	for (let k in o)
		if (known.includes(k))
			res[k]=o[k];

	return res;
}

export function arrayUnique(a) {
	function onlyUnique(value, index, array) {
		return array.indexOf(value) === index;
	}

	return a.filter(onlyUnique);
}

export function isPromise(p) {
	return (typeof p?.then=="function");
}
