import {arrayUnique, arrayIntersection} from "../utils/js-util.js";
import {matchCondition} from "./conf-util.js";
import ClientField from "./ClientField.js";
import ClientFieldArray from "./ClientFieldArray.js";
import FIELD_TYPES from "./field-types.jsx";
import {json5ParseObject} from "../utils/json5-util.js";

export default class ClientCollection {
	constructor(data, conf) {
		Object.assign(this,data);
		this.conf=conf;

	    let clientFields={}
	    for (let k in this.fields) {
	    	let clientField=new ClientField({
	    		...this.fields[k],
	    		FIELD_TYPES
	    	});
	    	clientField.conf=this.conf;
	    	clientField.collection=this;
	    	clientFields[k]=clientField;
	    }

	    this.fields=clientFields;
	}

	getPath() {
		if (this.type=="singleView")
			return "/"+this.id+"/single";

		return "/"+this.id;
	}

	getActivePolicy() {
		for (let policy of this.policies)
			if (policy.roles.includes(this.conf.role))
				return policy;
	}

	getOperationPolicies(operation) {
		let policies=[];

		for (let policy of this.policies)
			if (policy.roles.includes(this.conf.role) &&
					policy.operations.includes(operation))
				policies.push(policy);

		return policies;
	}

	isVisible() {
		let policy=this.getActivePolicy();
		if (!policy)
			return false;

		return (policy.operations.includes("read"));
	}

	isWritable() {
		return (this.getOperationPolicies("update").length>0);

		/*let policy=this.getActivePolicy();
		if (!policy)
			return false;

		return (policy.operations.includes("update"));*/
	}

	getFields() {
		return ClientFieldArray.from(Object.values(this.fields));
	}

	isFieldWritable(fid) {
		return this.getActivePolicy().writable.includes(fid);
	}
}