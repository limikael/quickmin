import R2Storage from "../storage/R2Storage.js";

export function r2StorageDriver(server) {
	server.storage=new R2Storage(server.conf.env[server.conf.r2Bucket]);
}

export default r2StorageDriver;