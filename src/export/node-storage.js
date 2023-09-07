import NodeStorage from "../storage/NodeStorage.js";

export function configureNodeStorage(conf) {
	conf.storageFactory=(conf)=>{
		return new NodeStorage(conf);
	}
}

export default configureNodeStorage;