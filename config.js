require("dotenv").config();

DATABASE_URL = process.env.DATABASE_URL === undefined ? './bot.db' : process.env.DATABASE_URL;
const { Sequelize } = require('sequelize');

module.exports ={
    DATABASE_URL: DATABASE_URL,
    DATABASE: DATABASE_URL === './bot.db' ? new Sequelize({ dialect: "sqlite", storage: DATABASE_URL, logging: false }) : new Sequelize(DATABASE_URL, { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }, logging: false }), 
    apiId : Number(process.env.API_ID),
    apiHash : process.env.API_HASH,
    session : process.env.SESSION ? process.env.SESSION : "",
    BOT_TOKEN:process.env.BOT_TOKEN,
    sudo:this.sudo,
    DEVELOPMENT:process.env.STATE === undefined ? false : process.env.STATE,    
    setSudo:function(s) {
        this.sudo = s;
    },
    getSudo:function(){
        return this.sudo;
    }
}