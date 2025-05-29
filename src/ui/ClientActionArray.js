export default class ClientActionArray extends Array {
	getNonGlobal() {
		return this.filter(a=>a.scope!="global");
	}

	getGlobal() {
		return this.filter(a=>a.scope=="global");
	}
}