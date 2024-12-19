import dotenv from "dotenv";
dotenv.config();

import { Sequelize } from "sequelize";

const DATABASE_URL: string = process.env.DATABASE_URL ?? './bot.db';

const DATABASE = DATABASE_URL === './bot.db'
  ? new Sequelize({
      dialect: "sqlite",
      storage: DATABASE_URL,
      logging: false,
    })
  : new Sequelize(DATABASE_URL, {
      dialectOptions: { 
        ssl: { 
          require: true, 
          rejectUnauthorized: false 
        },
      },
      logging: false,
    });

const apiId: number | undefined = process.env.API_ID ? Number(process.env.API_ID) : undefined;
const apiHash: string | undefined = process.env.API_HASH;
const session: string = process.env.SESSION ?? "";
const BOT_TOKEN: string | undefined = process.env.BOT_TOKEN;
const DEVELOPMENT: boolean = process.env.STATE ? process.env.STATE === "true" : false;

let sudo: any;

const config = {
  DATABASE_URL,
  DATABASE,
  apiId,
  apiHash,
  session,
  BOT_TOKEN,
  sudo,
  DEVELOPMENT,

  setSudo: function (s: any): void {
    sudo = s;
  },

  getSudo: function (): any {
    return sudo;
  },
};

export default config;

module.exports = config
