import {arrayUnique} from "../utils/js-util.js";
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

	isVisible() {
	    if (!this.readAccess.includes(this.conf.role))
	        return false;

	    if (this.showFor.length && this.showFor.includes(this.conf.role))
	        return true;

	    if (this.hideFor.length && this.hideFor.includes(this.conf.role))
	        return false;

		return true;
	}

	isWritable() {
	    return this.access.includes(this.conf.role);
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
}