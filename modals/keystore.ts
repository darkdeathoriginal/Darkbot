const { DATABASE } = require("../config");
const { DataTypes } = require("sequelize");

const KeyStoreDb = DATABASE.define("KeyStore", {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});
module.exports = KeyStoreDb;
