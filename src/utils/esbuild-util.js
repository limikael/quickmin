export function moduleAlias(aliases) {
	function escapeNamespace(keys) {
		return new RegExp(
	    	`^${keys
				.map((str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
				.join('|')}$`
		);
	}

	const escapedNamespace = escapeNamespace(Object.keys(aliases));

	return {
		name: "myaliaspath",
		setup: (build)=>{
			let resolveResults={};

			build.onResolve({filter: escapedNamespace},async (ev)=>{
				if (!aliases[ev.path])
					return null;

				if (!resolveResults[ev.path]) {
					let result=await build.resolve(aliases[ev.path],{
						kind: ev.kind,
						resolveDir: "."
					});

			        if (result.errors.length > 0)
			            return { errors: result.errors }

					resolveResults[ev.path]={path: result.path};
				}

		        return resolveResults[ev.path];
			});
		}
	}
}
