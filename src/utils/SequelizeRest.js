import {getRequestOpts} from "./js-util.js";

export default class SequelizeRest {
	constructor(conf={}) {
		this.sequelize=conf.sequelize;
		this.path=conf.path;
	}

	handle=async (req, res)=>{
		let opts=getRequestOpts(req);
		//console.log(opts);

		if (this.path) {
			if (this.path!=opts._[0]) {
				res.end("error");
				return;
			}

			opts._.shift();
		}

		let modelName=opts._[0];
		let param=opts._[1];
		if (!this.sequelize.models[modelName]) {
			res.end("error");
			return;
		}

		let model=this.sequelize.models[modelName];
		let result;

		// Get many / list
		if (req.method=="GET" && !param) {
			res.setHeader("Content-Range","0-2/2");
			result=await this.sequelize.models[modelName].findAll();
		}

		// Get one
		else if (req.method=="GET" && param) {
			result=await this.sequelize.models[modelName].findByPk(param);
		}

		// Create

		res.end(JSON.stringify(result));
	}
}