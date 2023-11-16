const { DATABASE } = require("../config");
const { DataTypes } = require("sequelize");

const ExternalPluginDb = DATABASE.define("ExternalPlugin", {
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
module.exports = ExternalPluginDb;
