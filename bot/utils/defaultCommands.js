const startCommand = {
    pattern:"start",
    description:"Start command",
    callback:async (message,match) => {
        console.log(this);
        await message.send("Bot is started!");
    }
}

const pingCommand = {
    pattern: "ping",
    description: "Ping command",
    callback: async (m, match) => {
      let start = new Date().getTime();
      await m.send(`❮ ᴛᴇsᴛɪɴɢ ᴘɪɴɢ ❯`);
      let end = new Date().getTime();
      await m.send(`ʟᴀᴛᴇɴᴄʏ: ${end - start} ᴍs`);
    },
  }
module.exports = {startCommand,pingCommand}