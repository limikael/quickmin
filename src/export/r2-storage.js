import R2Storage from "../storage/R2Storage.js";

export function r2StorageDriver(server, driverOptions) {
	server.storage=new R2Storage(driverOptions.env[server.getConf("Storage").r2]);
}

export default r2StorageDriver;