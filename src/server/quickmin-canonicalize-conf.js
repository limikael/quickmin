import {parse as parseYaml} from "yaml";
import {parse as parseXml} from "txml/txml";

export function quickminCanonicalizeConf(conf) {
	if (!conf)
		conf={};

    if (typeof conf=="string")
        conf=parseYaml(conf);

    if (!conf.collections)
    	conf.collections={};

    for (let collectionId in conf.collections) {
    	let collectionConf=conf.collections[collectionId];

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
    }

    //console.log(conf.collections);
    return conf;
}