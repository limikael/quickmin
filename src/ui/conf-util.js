import {arrayUnique} from "../utils/js-util.js";

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
