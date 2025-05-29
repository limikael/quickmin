import {json5ParseObject} from "../utils/json5-util.js";
import {matchCondition} from "./conf-util.js";

export default class ClientField {
	constructor(field) {
		Object.assign(this,field);

		this.ListComp=this.FIELD_TYPES[this.type].list;
		this.EditComp=this.FIELD_TYPES[this.type].edit;
		this.FilterComp=this.FIELD_TYPES[this.type].filter;

		if (this.condition && typeof this.condition=="string")
			this.condition=json5ParseObject(this.condition);
	}

	isListable() {
		return this.collection.listFields.includes(this.id);
	}

	inNarrowSet(operation) {
		return this.collection.getNarrowFieldSet(operation).includes(this.id)
	}

	inWideSet(operation) {
		return this.collection.getWideFieldSet(operation).includes(this.id)
	}

	conditionMatchRecord(record) {
		if (!this.condition)
			return true;

		return matchCondition(record,this.condition);
	}
}