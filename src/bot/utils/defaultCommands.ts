import { Bot } from "./Bot";
import { Command } from "../handler";

export const startCommand:Command = {
  pattern: "start",
  description: "Start command",
  on:"message",
  callback: async (message, match, obj:Bot) => {
    let msg = "Bot is started!\n\nBot commands:\n";
    
    for (let i of obj.modules) {
      if(i.pattern && i.description && !i.dontAdd){
        msg += `/${i.pattern} - ${i.description}\n`;
      }
    }
    await message.send(msg);
  },
};

export const pingCommand:Command = {
  pattern: "ping",
  description: "Ping command",
  on:"message",
  callback: async (m, match,client) => {
    let start = new Date().getTime();
    await m.send(`❮ ᴛᴇsᴛɪɴɢ ᴘɪɴɢ ❯`);
    let end = new Date().getTime();
    await m.send(`ʟᴀᴛᴇɴᴄʏ: ${end - start} ᴍs`);
  },
};
module.exports = { startCommand, pingCommand };
