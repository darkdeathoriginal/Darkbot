import { Model } from "sequelize";
import config from "../config";
const {DATABASE} = config
const { DataTypes } = require("sequelize");

export class ExternalBotDb extends Model{
  declare url:string
  declare name:string
  declare token:string
}
ExternalBotDb.init({
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  }
},
  {
    sequelize:DATABASE,
    modelName:"ExternalBot"
  }
)
