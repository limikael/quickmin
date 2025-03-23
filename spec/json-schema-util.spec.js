import {jsonSchemaCreateDefault} from "../src/utils/json-schema-util.js";

describe("json-schema-util",()=>{
	it("can create defaults",()=>{
		expect(jsonSchemaCreateDefault({
			type: "string",
			default: "hello"
		})).toEqual("hello");

		expect(jsonSchemaCreateDefault({
			type: "object",
			properties: {
				bla: {
					type: "string",
					default: "xyz"
				}
			},
			default: {
				hello: "world"
			}
		})).toEqual({bla: "xyz", hello: "world"});
	});
})