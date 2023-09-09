import NodeStorage from "../storage/NodeStorage.js";

export function nodeStorageDriver(server) {
	let upload=server.conf.upload;
	if (!upload)
		upload="upload";

	server.storage=new NodeStorage(upload);
}

export default nodeStorageDriver;