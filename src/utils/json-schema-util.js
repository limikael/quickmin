import {arrayUnique, objectRemoveUnknown} from "./js-util.js";

export function jsonSchemaFix(schema, value) {
	if (!schema)
		return value;

	switch (schema.type) {
		case "string":
			if (value===undefined)
				value=schema.default;

			value=String(value);
			if (schema.enum && !schema.enum.includes(value))
				value=schema.default;

			return value;
			break;

		case "number":
			if (value===undefined)
				value=schema.default;

			return Number(value);
			if (schema.enum && !schema.enum.includes(value))
				value=schema.default;

			return value;
			break;

		case "boolean":
			if (typeof value!="boolean")
				value=schema.default;

			if (value===undefined)
				value=false;

			return value;
			break;

		case "object":
			value={...value};
			let keys=arrayUnique(Object.keys(schema.properties),schema.required);
			for (let key of keys)
				value[key]=jsonSchemaFix(schema.properties[key],value[key]);

			if (!schema.additionalProperties)
				value=objectRemoveUnknown(value,keys);

			return value;
			break;

		default:
			throw new Error("Unknown json schema type: "+schema.type);
	}
}

/*export function jsonSchemaCreateDefault(schema) {
	if (schema.type=="object") {
		let def={};
		if (schema.default)
			def={...def,...schema.default};

		for (let k in schema.properties) {
			let v=jsonSchemaCreateDefault(schema.properties[k]);
			if (v!==undefined)
				def[k]=v;
		}

		return def;
	}

	return schema.default;
}*/