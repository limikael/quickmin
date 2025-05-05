import {arrayUnique} from "../utils/js-util.js";

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
