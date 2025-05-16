import ClientFieldArray from "../../src/ui/ClientFieldArray.js";
import ClientField from "../../src/ui/ClientField.js";

describe("ClientFieldArray",()=>{
	let FIELD_TYPES={
		text: {
			list: ()=>{}
		}
	}

	it("works",()=>{
		let a;

		a=ClientFieldArray.from([
			new ClientField({type: "text",FIELD_TYPES}),
			new ClientField({type: "text",FIELD_TYPES}),
		]);

		expect(a.hasUntabbed()).toEqual(true);
		expect(a.getTabs()).toEqual([undefined]);

		a=ClientFieldArray.from([
			new ClientField({type: "text",FIELD_TYPES,tab: "hello"}),
			new ClientField({type: "text",FIELD_TYPES,tab: "world"}),
			new ClientField({type: "text",FIELD_TYPES,tab: "world"}),
		]);

		expect(a.hasUntabbed()).toEqual(false);
		expect(a.getTabs()).toEqual(["hello","world"]);
	});
});