export function confGetCategories(conf) {
    let categories=[];
    for (let cid in conf.collections) {
        let collection=conf.collections[cid];
        if (collection.category && !categories.includes(collection.category))
            categories.push(collection.category);
    }

    return categories;
}

export function confGetCollectionsByCategoryAndRole(conf, category, role) {
	let collections=[];
    for (let cid in conf.collections) {
        let collection=conf.collections[cid];
        if (collection.category==category &&
        		collection.readAccess.includes(role))
        	collections.push(collection)
    }

    return collections;
}

export function confGetCategoryByCollection(conf, collectionId) {
	if (!conf.collections[collectionId])
		return;

	return conf.collections[collectionId].category;
}