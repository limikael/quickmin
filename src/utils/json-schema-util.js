export function jsonSchemaCreateDefault(schema) {
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
}