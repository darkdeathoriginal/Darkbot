import { Model } from "sequelize";
import config from "../config";
const {DATABASE} = config
const { DataTypes } = require("sequelize");


export class ExternalPluginDb extends Model{
}

ExternalPluginDb.init({
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
},{
  sequelize:DATABASE,
  modelName:"ExternalPlugin"
})

