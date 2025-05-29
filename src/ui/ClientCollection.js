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

	getActivePolicies() {
		return this.policies.filter(p=>p.roles.includes(this.conf.role));
	}

	getActivePolicyOperations() {
		let ops=[];

		for (let activePolicy of this.getActivePolicies())
			ops.push(...activePolicy.operations);

		return arrayUnique(ops);
	}

	getCreateFields() {
		let fields=[]
		for (let policy of this.getActivePolicies())
			if (policy.operations.includes("create"))
				fields.push(...policy.include);

		return arrayUnique(fields);
	}

	/*getOperationPolicies(operation) {
		let policies=[];

		for (let policy of this.policies)
			if (policy.roles.includes(this.conf.role) &&
					policy.operations.includes(operation))
				policies.push(policy);

		return policies;
	}

	isVisible() {
		return (this.getOperationPolicies("read").length>0);
	}

	isWritable() {
		return (this.getOperationPolicies("update").length>0);
	}*/

	getFields() {
		return ClientFieldArray.from(Object.values(this.fields));
	}
}