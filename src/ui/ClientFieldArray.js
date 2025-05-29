import {arrayUnique} from "../utils/js-util.js";

export default class ClientFieldArray extends Array {
	getListable() {
		return this.filter(f=>f.isListable());
	}

	getForTab(tab) {
		return this.filter(f=>f.tab==tab);
	}

	getForSection(section) {
		return this.filter(f=>f.section==section);
	}

	hasUntabbed() {
		return this.some(f=>!f.tab);
	}

	getTabs() {
		return arrayUnique(this.map(f=>f.tab))
	}

	getSections() {
		return arrayUnique(this.map(f=>f.section))
	}

	hasTabs() {
		return this.some(f=>!!f.tab);
	}

	getConditionMatchingRecord(record) {
		return this.filter(f=>f.conditionMatchRecord(record));
	}
}