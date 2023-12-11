import {arrayOnlyUnique} from "../utils/js-util.js";

export function confGetCategories(conf) {
    let categories=[];
    for (let cid in conf.collections) {
        let collection=conf.collections[cid];
        if (collection.category && !categories.includes(collection.category))
            categories.push(collection.category);
    }

    return categories;
}

export function confGetCategoryByCollection(conf, collectionId) {
	if (!conf.collections[collectionId])
		return;

	return conf.collections[collectionId].category;
}

export function confIsCollectionWritable(conf, collectionId) {
    let collection=conf.collections[collectionId];

    return collection.access.includes(conf.role);
}

export function confGetCollections(conf) {
    return Object.keys(conf.collections).map(id=>conf.collections[id]);
}

export function confGetReadableCollections(conf) {
    return (
        confGetCollections(conf)
            .filter(collection=>collection.readAccess.includes(conf.role))
    )
}

export function confGetReadableCollectionsByCategory(conf, category) {
    return (
        confGetReadableCollections(conf)
            .filter(collection=>collection.category==category)
    )
}

export function collectionGetPath(collection) {
    let to="/"+collection.id;
    if (collection.type=="singleView")
        to="/"+collection.id+"/single";

    return to;
}

export function collectionGetTabs(collection) {
    let tabs=[];
    for (let field of Object.values(collection.fields)) {
        if (field.tab)
            tabs.push(field.tab);
    }

    return arrayOnlyUnique(tabs);
}

export function collectionHasUntabbed(collection) {
    for (let field of Object.values(collection.fields))
        if (!field.tab)
            return true;

    return false;
}

export function matchCondition(record, where) {
    for (let k in where) {
        //console.log(where[k]);
        if (Array.isArray(where[k])) {
            if (!where[k].includes(record[k]))
                return false;
        } 

        else {
            if (record[k]!=where[k])
                return false;
        }
    }

    return true;
}
