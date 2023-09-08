import {Sequelize, DataTypes} from "sequelize";

let SEQUELIZE_TYPES={
    "text": DataTypes.STRING,
    "richtext": DataTypes.TEXT,
    "date": DataTypes.DATEONLY,
    "datetime": DataTypes.DATE,
    "select": DataTypes.STRING
}

export default class SequelizeDb {
	constructor(conf) {
		Object.assign(this,conf);

		if (!this.sequelize)
	        this.sequelize=new Sequelize(this.dsn);

        for (let c in this.collections) {
            let attrs={}
            for (let f in this.collections[c].fields) {
                attrs[f]={
                    type: SEQUELIZE_TYPES[this.collections[c].fields[f].type]
                }
            }

            this.sequelize.define(c,attrs,{timestamps: false});
        }
	}

	async findMany(modelName) {
		let model=this.sequelize.models[modelName];
		return await model.findAll();
	}

	async findOne(modelName, id) {
		let model=this.sequelize.models[modelName];
		return await model.findByPk(id);
	}

	async insert(modelName, data) {
        let model=this.sequelize.models[modelName];
		let instance=await model.build(data);
		await instance.save();
		return instance;
	}

	async update(modelName, id, data) {
        let model=this.sequelize.models[modelName];
        let instance=await model.findByPk(id);
        instance.set(data);
        await instance.save();
        return instance;
	}

	async delete(modelName, id) {
		let model=this.sequelize.models[modelName];
		let instance=await model.findByPk(id);
		await instance.destroy();
		return instance;
	}

	isModel(modelName) {
		return this.sequelize.models.hasOwnProperty(modelName);
	}
}