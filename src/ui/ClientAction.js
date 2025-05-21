export default class ClientAction {
	constructor(action) {
		Object.assign(this,action);
	}

	getOptions() {
		if (!this.options)
			return [];

		return Object.keys(this.options).map(k=>({id: k, ...this.options[k]}));
	}

	async run(actionFlow) {
		try {
			let method=this.conf.getClientMethod(this.method);

			let params={};
			if (this.options) {
				params=await actionFlow.showOptionsModal({
					title: this.name,
					options: this.getOptions(),
					helperText: this.helperText
				});

				if (!params)				
					return;
			}

			//await actionFlow.showOptionsModal({title: this.name});

			let result;
			actionFlow.showProgressModal({title: this.name});

			if (this.scope=="global") {
				result=await method({
					qql: this.conf.qql,
					...params
				});
			}

			else {
				for (let id of actionFlow.getIds()) {
					result=await method({
						id: id,
						qql: this.conf.qql,
						...params
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