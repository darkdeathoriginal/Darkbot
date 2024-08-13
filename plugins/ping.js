const { message } = require("telegram/client");
const { Module } = require("../index");
Module(
  { pattern: "ping", fromMe: true, desc: "Ping command", use: "utility" },
  async (m, match) => {
    let start = new Date().getTime();
    const a = await m.client.sendMessage(m.jid,{message:"❮ ᴛᴇsᴛɪɴɢ ᴘɪɴɢ ❯"})
    let end = new Date().getTime();
    return await m.client.editMessage(m.jid,{text:`ʟᴀᴛᴇɴᴄʏ: ${end - start} ᴍs`,message:a.id})
  }
);
Module(
  { pattern: "id", fromMe: true, desc: "Id command", use: "utility" },
  async (m, match) => {
    if (m.quoted) {
      const quoted = await m.getQuoted();
      let id =quoted.jid
      let username = await m.getUsername(id);
      return await m.send(`ID of ${username} is ${id}`);
    }
    let id = m.jid;
    let username = await m.getUsername(id);
    return await m.send(`ID of @${username} is ${id}`);
  }
);
