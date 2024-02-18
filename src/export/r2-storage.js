import R2Storage from "../storage/R2Storage.js";

export function r2StorageDriver(server) {
	if (!server.isStorageUsed())
		return;

	if (!server.conf.r2Bucket)
		throw new Error("There are fields requiring storage, but no R2 bucket is configured.");

	server.storage=new R2Storage(server.conf.env[server.conf.r2Bucket]);
}

export default r2StorageDriver;