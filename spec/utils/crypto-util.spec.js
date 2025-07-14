import {hashPassword, verifyPassword} from "../../src/utils/crypto-util.js";

describe("crypto-util",()=>{
	it("can hash and verify passwords",async ()=>{
		let hashed=await hashPassword({password: "helloworld", secret: "test"});
		//console.log(hashed);

		expect(await verifyPassword({password: "helloworld", stored: hashed, secret: "test"})).toEqual(true);
		expect(await verifyPassword({password: "helloworld1", stored: hashed})).toEqual(false);

		let v=await verifyPassword({
			password: "hello",
			stored: "553cf4058a56d172b38f495d23247fc7:8c1c582df2d410e68da6429000ee982d3f1f788d1d8341fc048d855cb19d9e0e"
		});
		//console.log("v: ",v);
		expect(v).toEqual(true);
	});
});
