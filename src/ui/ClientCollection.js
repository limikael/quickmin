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
}