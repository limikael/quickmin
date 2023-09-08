import NodeStorage from "../storage/NodeStorage.js";

export function nodeStorageDriver(server) {
	if (!server.getConf("Storage").local)
		return;

	server.storage=new NodeStorage(server.getConf("Storage").local);
}

export default nodeStorageDriver;