import { Module } from "..";

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
      const quoted =await m.getQuoted()
      if(!quoted) return m.send("Cannot find quoted message")        
      let username = await m.getUsername(quoted.userId);
      const tojson = quoted.userId.toJSON()
      if(!username) return await m.send("Cannot find id")
      if("userId" in tojson){
        return await m.send(`ID of ${username} is ${tojson.userId}`);
      }
    }
    let id = m.jid;
    let username = await m.getUsername(id);
    return await m.send(`ID of @${username} is ${m.jidValue}`);
  }
);
