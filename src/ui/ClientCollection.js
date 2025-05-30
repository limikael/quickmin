import {arrayUnique, arrayIntersection} from "../utils/js-util.js";
import {matchCondition} from "./conf-util.js";
import ClientField from "./ClientField.js";
import ClientAction from "./ClientAction.js";
import ClientFieldArray from "./ClientFieldArray.js";
import ClientActionArray from "./ClientActionArray.js";
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

	    let clientActions=[];
	    for (let action of this.actions) {
	    	clientActions.push(new ClientAction({
	    		collection: this,
	    		conf: this.conf,
	    		...action
	    	}))
	    }

	    this.actions=ClientActionArray.from(clientActions);
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

	isVisible() {
		let policy=this.getActivePolicy();
		if (!policy)
			return false;

		return (policy.operations.includes("read"));
	}

	isWritable() {
		let policy=this.getActivePolicy();
		if (!policy)
			return false;

		return (policy.operations.includes("update"));
	}

	getFields() {
		return ClientFieldArray.from(Object.values(this.fields));
	}

	getActions() {
		return this.actions;
	}

	isFieldWritable(fid) {
		return this.getActivePolicy().writable.includes(fid);
	}
}