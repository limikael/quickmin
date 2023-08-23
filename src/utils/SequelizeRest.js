import {netTry, trimChar} from "./js-util.js";
import express from "express";

export default class SequelizeRest {
	constructor(conf={}) {
		this.sequelize=conf.sequelize;
		this.middleware=express();

		this.authorizeWrite=()=>{};
		if (conf.authorizeWrite)
			this.authorizeWrite=conf.authorizeWrite;

		this.middleware.get(`/:model`,(req, res, next)=>{
			if (!this.isModel(req.params.model))
				return next();

			netTry(res,async ()=>{
				res.setHeader("Content-Range","0-2/2");
				let model=this.sequelize.models[req.params.model];
				res.json(await model.findAll());
			});
		});

		this.middleware.get(`/:model/:id`,(req, res, next)=>{
			if (!this.isModel(req.params.model))
				return next();

			netTry(res,async ()=>{
				let model=this.sequelize.models[req.params.model];
				res.json(await model.findByPk(req.params.id));
			});
		});

		this.middleware.put(`/:model/:id`,(req, res, next)=>{
			if (!this.isModel(req.params.model))
				return next();

			netTry(res,async ()=>{
				this.authorizeWrite(req);
				let model=this.sequelize.models[req.params.model];
				let instance=await model.findByPk(req.params.id);
				instance.set(req.body);
				await instance.save();
				res.json(instance);
			});
		});

		this.middleware.post(`/:model`,(req, res, next)=>{
			if (!this.isModel(req.params.model))
				return next();

			netTry(res,async ()=>{
				this.authorizeWrite(req);
				let model=this.sequelize.models[req.params.model];
				let instance=await model.build(req.body);
				await instance.save();
				res.json(instance);
			});
		});

		this.middleware.delete(`/:model/:id`,(req, res, next)=>{
			if (!this.isModel(req.params.model))
				return next();

			netTry(res,async ()=>{
				this.authorizeWrite(req);
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