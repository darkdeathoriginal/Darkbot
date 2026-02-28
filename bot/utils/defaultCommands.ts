const startCommand = {
  pattern: "start",
  description: "Start command",
  callback: async (message, match, obj) => {
    let msg = "Bot is started!\n\nBot commands:\n";
    for (let i of obj.modules) {
      if(i.pattern && i.description && !i.dontAdd){
        msg += `/${i.pattern} - ${i.description}\n`;
      }
    }
    await message.send(msg);
  },
};

const pingCommand = {
  pattern: "ping",
  description: "Ping command",
  callback: async (m, match) => {
    let start = new Date().getTime();
    await m.send(`❮ ᴛᴇsᴛɪɴɢ ᴘɪɴɢ ❯`);
    let end = new Date().getTime();
    await m.send(`ʟᴀᴛᴇɴᴄʏ: ${end - start} ᴍs`);
  },
};
module.exports = { startCommand, pingCommand };
