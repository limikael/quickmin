import {urlGetParams} from "../../src/utils/js-util.js";

describe("js-util",()=>{
	it("can get params, also with hash",()=>{
		let u="http://hello.com/test?a=1&b=2#something?another=1&test=2";

		expect(urlGetParams(u)).toEqual({ a: '1', b: '2' });

		//console.log(urlGetParams(u,{afterHash: true}));

		expect(urlGetParams(u,{afterHash: true})).toEqual({ a: '1', b: '2', another: '1', test: '2' });
	});
});
