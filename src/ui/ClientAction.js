export default class ClientAction {
	constructor(action) {
		Object.assign(this,action);
	}

	async run(actionFlow) {
		try {
			let method=this.conf.getClientMethod(this.method);

			//await actionFlow.showOptionsModal({title: this.name});

			let result;
			actionFlow.showProgressModal({title: this.name});

			if (this.scope=="global") {
				result=await method({
					qql: this.conf.qql
				});
			}

			else {
				for (let id of actionFlow.getIds()) {
					result=await method({
						id: id,
						qql: this.conf.qql
					});
				}
			}

			actionFlow.dismissModal();
			actionFlow.refresh();

			if (result)
				await actionFlow.showMessageModal({title: this.name, message: result});
		}

		catch (e) {
			console.log("caught action error");
			console.log(e);
			await actionFlow.showErrorModal({error: e, title: this.name});
			actionFlow.refresh();
		}
	}
}