import {netTry, trimChar} from "./js-util.js";
import express from "express";
import bodyParser from "body-parser";

export default class SequelizeRest {
	constructor(conf={}) {
		this.sequelize=conf.sequelize;
		this.path=conf.path;
		this.middleware=express();

		this.middleware.use(bodyParser.json());

		let apiRoot=trimChar(conf.apiRoot,"/");
		if (apiRoot)
			apiRoot="/"+apiRoot;

		this.middleware.get(`${apiRoot}/:model`,(req, res, next)=>{
			if (!this.isModel(req.params.model))
				return next();

			netTry(res,async ()=>{
				res.setHeader("Content-Range","0-2/2");
				let model=this.sequelize.models[req.params.model];
				res.json(await model.findAll());
			});
		});

		this.middleware.get(`${apiRoot}/:model/:id`,(req, res, next)=>{
			if (!this.isModel(req.params.model))
				return next();

			netTry(res,async ()=>{
				let model=this.sequelize.models[req.params.model];
				res.json(await model.findByPk(req.params.id));
			});
		});

		this.middleware.put(`${apiRoot}/:model/:id`,(req, res, next)=>{
			if (!this.isModel(req.params.model))
				return next();

			netTry(res,async ()=>{
				let model=this.sequelize.models[req.params.model];
				let instance=await model.findByPk(req.params.id);
				instance.set(req.body);
				await instance.save();
				res.json(instance);
			});
		});

		this.middleware.post(`${apiRoot}/:model`,(req, res, next)=>{
			if (!this.isModel(req.params.model))
				return next();

			netTry(res,async ()=>{
				let model=this.sequelize.models[req.params.model];
				let instance=await model.build(req.body);
				await instance.save();
				res.json(instance);
			});
		});

		this.middleware.delete(`${apiRoot}/:model/:id`,(req, res, next)=>{
			if (!this.isModel(req.params.model))
				return next();

			netTry(res,async ()=>{
				let model=this.sequelize.models[req.params.model];
				let instance=await model.findByPk(req.params.id);
				await instance.destroy();
				res.json(instance);
			});
		});

	}

	isModel(cand) {
		return this.sequelize.models.hasOwnProperty(cand);
	}
}