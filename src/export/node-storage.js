import NodeStorage from "../storage/NodeStorage.js";

export function nodeStorageDriver(server) {
	if (!server.isStorageUsed())
		return;

	let upload=server.conf.upload;
	if (!upload)
		upload="upload";

	server.storage=new NodeStorage(upload);
}

export default nodeStorageDriver;