import SequelizeRest from "../../src/utils/SequelizeRest.js";
import {Sequelize, DataTypes} from "sequelize";

describe("SequelizeRest",()=>{
	it("works",async ()=>{
		/*let sequelize=new Sequelize("sqlite::memory:");

		sequelize.define("users",{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true
			},
			firstname: {
				type: DataTypes.STRING
			}
		},{
			timestamps: false
		});

		await sequelize.sync();

		await sequelize.models.users.build({firstname: "Micke"}).save();
		await sequelize.models.users.build({firstname: "Micke2"}).save();

		console.log(sequelize.models.users.getAttributes());

		let users=await sequelize.models.users.findAll();
		console.log(users[0].firstname);*/
	})
})