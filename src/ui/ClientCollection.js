import {arrayUnique, arrayIntersection} from "../utils/js-util.js";
import {matchCondition} from "./conf-util.js";

export default class ClientCollection {
	constructor(data, conf) {
		Object.assign(this,data);
		this.conf=conf;
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

	getTabs() {
	    let tabs=[];
	    for (let field of Object.values(this.fields)) {
	        if (field.tab)
	            tabs.push(field.tab);
	    }

	    return arrayUnique(tabs);
	}

	getSectionsForTab(tab) {
	    let sections=[];
	    for (let field of Object.values(this.fields)) {
	        if (field.tab==tab)
	            sections.push(field.section);
	    }

	    return arrayUnique(sections);
	}

	getVisibleTabs(watchRecord) {
	    let tabs=[];
	    for (let field of Object.values(this.fields)) {
	        let matched=true;
	        if (field.condition)
	            matched=matchCondition(watchRecord,JSON.parse(field.condition));

	        if (field.tab && matched)
	            tabs.push(field.tab);
	    }

	    return arrayUnique(tabs);
	}

	hasUntabbed() {
	    for (let field of Object.values(this.fields))
	        if (!field.tab)
	            return true;

	    return false;
	}

	getVisibleListFields() {
		let listFields=arrayIntersection(
			this.listFields,
			this.getActivePolicy().include
		);

		return listFields.map(f=>this.fields[f]);
	}

	getVisibleFields() {
		let visibleFields=arrayIntersection(
			Object.keys(this.fields),
			this.getActivePolicy().include
		);

		return visibleFields.map(f=>this.fields[f]);
	}

	isFieldWritable(fid) {
		return this.getActivePolicy().writable.includes(fid);
	}
}