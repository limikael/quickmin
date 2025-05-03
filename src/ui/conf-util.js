import {arrayUnique} from "../utils/js-util.js";

export function confIsCollectionVisible(conf, collectionId) {
    let collection=conf.collections[collectionId];

    if (!collection.readAccess.includes(conf.role))
        return false;

    if (collection.showFor.length && collection.showFor.includes(conf.role))
        return true;

    if (collection.hideFor.length && collection.hideFor.includes(conf.role))
        return false;

    return true;
}

export function confGetVisibleCollections(conf) {
    return (
        confGetCollections(conf)
            .filter(collection=>confIsCollectionVisible(conf,collection.id))
    )
}

export function confGetVisibleCollectionsByCategory(conf, category) {
    return (
        confGetVisibleCollections(conf)
            .filter(collection=>collection.category==category)
    )
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

    return arrayUnique(tabs);
}

export function collectionGetSectionsForTab(collection, tab) {
    let sections=[];
    for (let field of Object.values(collection.fields)) {
        if (field.tab==tab)
            sections.push(field.section);
    }

    return arrayUnique(sections);
}

export function collectionGetVisibleTabs(collection, watchRecord) {
    let tabs=[];
    for (let field of Object.values(collection.fields)) {
        let matched=true;
        if (field.condition)
            matched=matchCondition(watchRecord,JSON.parse(field.condition));

        if (field.tab && matched)
            tabs.push(field.tab);
    }

    return arrayUnique(tabs);
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
