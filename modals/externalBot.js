const { DATABASE } = require("../config");
const { DataTypes } = require("sequelize");

const ExternalBotDb = DATABASE.define("ExternalBot", {
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
  },
});
module.exports = ExternalBotDb;
