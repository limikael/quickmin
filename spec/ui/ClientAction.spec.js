import ClientAction from "../../src/ui/ClientAction.js";

describe("ClientAction",()=>{
	it("can get options",()=>{
		let action=new ClientAction({
			options: {
				hello: {type: "text"},
				num: {type: "integer"}
			}
		});

		//console.log(action.getOptions());
		expect(action.getOptions()).toEqual([ { id: 'hello', type: 'text' }, { id: 'num', type: 'integer' } ]);
	});
});