import ClientField from "../../src/ui/ClientField.js";

describe("ClientField",()=>{
	let FIELD_TYPES={
		text: {
			list: ()=>{}
		}
	}

	it("works",()=>{
		let f={type: "text"};
		let clientField=new ClientField({...f,FIELD_TYPES});

		//console.log({...clientField});
	});

	it("can match a conditional record",()=>{
		let f={type: "text", condition: "hello: 'world'"};
		let clientField=new ClientField({...f,FIELD_TYPES});

		expect(clientField.condition).toEqual({
			hello: "world"
		});

		expect(clientField.conditionMatchRecord({hello: "world"})).toEqual(true);
		expect(clientField.conditionMatchRecord({hello: "worl"})).toEqual(false);

		f={type: "text"};
		clientField=new ClientField({...f,FIELD_TYPES});

		expect(clientField.conditionMatchRecord({hello: "world"})).toEqual(true);
		expect(clientField.conditionMatchRecord()).toEqual(true);

		//console.log({...clientField});
	});
});