const {DATABASE} = require('../config');
const { DataTypes } = require('sequelize');

const BotDb = DATABASE.define('bot', {
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    session: {
        type: DataTypes.STRING,
        allowNull: false,
    }
});
BotDb.sync()
module.exports = BotDb