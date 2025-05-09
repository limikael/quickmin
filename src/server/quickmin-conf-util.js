import {parse as parseYaml} from "yaml";
import {parse as parseXml} from "txml/txml";
import {arrayify, arrayDifference, arrayIntersection} from "../utils/js-util.js";

export function canonicalizePolicyForFields(policy, fields) {
    let {operations, roles, where,
        include, exclude, readonly, writable, ...extra}=policy;

    if (!fields)
        throw new Error("got no fields");

    if (Object.keys(extra).length)
        throw new Error("Unknown params in policy def: "+String(Object.keys(extra)));

    include=parseArrayOrCsvRow(include);
    exclude=parseArrayOrCsvRow(exclude);
    readonly=parseArrayOrCsvRow(readonly);
    writable=parseArrayOrCsvRow(writable);

    let readFields=include;
    if (!readFields.length)
        readFields=[...fields];

    readFields=arrayDifference(readFields,exclude);

    let writeFields=[...readFields];
    if (readonly.length)
        writeFields=arrayDifference(writeFields,readonly);

    if (writable.length)
        writeFields=arrayIntersection(writeFields,writable);

    operations=parseArrayOrCsvRow(operations);
    if (!operations.length)
        operations=["create","read","update","delete"];

    return ({
        roles: parseArrayOrCsvRow(roles),
        operations: operations,
        where: where,
        include: readFields,
        writable: writeFields,
    })
}

export function quickminGetClientMethod(conf, name) {
    for (let clientModule of conf.clientModules)
        if (clientModule[name])
            return clientModule[name]
}

export function parseArrayOrCsvRow(row) {
    if (row===undefined)
        return [];

    if (Array.isArray(row))
    	return row;

    return String(row).split(",").filter(s=>s!=="").map(s=>s.trim());
}

function canonicalizePolicyInPlace(policy) {
	policy.roles=parseArrayOrCsvRow(policy.roles);
	policy.operations=parseArrayOrCsvRow(policy.operations);
    if (!policy.operations.length)
        policy.operations=["create","read","update","delete"];

    policy.include=parseArrayOrCsvRow(policy.include);
    policy.exclude=parseArrayOrCsvRow(policy.exclude);
    policy.readonly=parseArrayOrCsvRow(policy.readonly);
    policy.writable=parseArrayOrCsvRow(policy.writable);
}

function canonicalizeCollectionConf(collectionConf) {
	if (typeof collectionConf.fields=="string") {
        let fieldConf={};
        let fieldEls=parseXml(collectionConf.fields);
        for (let fieldEl of fieldEls) {
        	if (!fieldEl.attributes.id)
        		throw new Error("Field missing id: "+JSON.stringify(fieldEl));

            for (let k in fieldEl.attributes)
                if (fieldEl.attributes[k]===null)
                    fieldEl.attributes[k]=true;

        	fieldConf[fieldEl.attributes.id]={
        		type: fieldEl.tagName.toLowerCase(),
        		...fieldEl.attributes
        	}
        }

        collectionConf.fields=fieldConf;
	}

    if (!collectionConf.policies)
        collectionConf.policies=[];

    if (!collectionConf.policies.length)
        collectionConf.policies.push({
            roles: ["admin"]
        });

    for (let i=0; i<collectionConf.policies.length; i++)
        canonicalizePolicyInPlace(collectionConf.policies[i]);
}

export function quickminCanonicalizeConf(conf) {
	if (!conf)
		conf={};

    if (typeof conf=="string")
        conf=parseYaml(conf);

    if (!conf.collections)
    	conf.collections={};

    conf.clientImports=arrayify(conf.clientImports);

    for (let collectionId in conf.collections)
    	canonicalizeCollectionConf(conf.collections[collectionId]);

    //console.log(conf.collections);
    return conf;
}

export function quickminMergeConf(conf1, conf2) {
	conf1=quickminCanonicalizeConf(conf1);
	conf2=quickminCanonicalizeConf(conf2);
	let conf={...conf1,...conf2};

	conf.clientImports=[...conf1.clientImports,...conf2.clientImports];

	conf.collections={...conf1.collections,...conf2.collections};
	for (let collectionId in conf.collections)
		conf.collections[collectionId].fields={
			...conf1.collections[collectionId]?.fields,
			...conf2.collections[collectionId]?.fields,
		}

	return conf;
}