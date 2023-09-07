import R2Storage from "../storage/R2Storage.js";

export function configureR2Storage(conf) {
	conf.storageFactory=(conf)=>{
		return new R2Storage(conf);
	}
}

export default configureR2Storage;