import { Model } from "sequelize";
import config from "../config";
const {DATABASE} = config
const { DataTypes } = require("sequelize");

export class BotDb extends Model{
    declare token:string
    declare session:string
}

BotDb.init({
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    session: {
        type: DataTypes.STRING,
        allowNull: false,
    }
},{
    sequelize:DATABASE,
    modelName:"bot"
})
