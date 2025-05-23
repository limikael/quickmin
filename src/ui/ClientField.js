import {json5ParseObject} from "../utils/json5-util.js";
import {matchCondition} from "./conf-util.js";

export default class ClientField {
	constructor(field) {
		Object.assign(this,field);

		this.ListComp=this.FIELD_TYPES[this.type].list;
		this.EditComp=this.FIELD_TYPES[this.type].edit;

		if (this.condition && typeof this.condition=="string")
			this.condition=json5ParseObject(this.condition);
	}

	isListable() {
		return this.collection.listFields.includes(this.id);
	}

	isVisible() {
		return this.collection.getActivePolicy().include.includes(this.id);
	}

	isWritable() {
		if (!this.collection.isWritable())
			return false;

		return this.collection.getActivePolicy().writable.includes(this.id);
	}

	conditionMatchRecord(record) {
		if (!this.condition)
			return true;

		return matchCondition(record,this.condition);
	}
}