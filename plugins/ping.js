const { Module } = require('../index');
Module({ pattern: 'ping', fromMe: true, desc: 'Ping command', use: 'utility' }, async (m,match) => {
    // Handle start command logic here
    let start = new Date().getTime()
    await m.client.sendMessage(m.message.peerId, {
      message: `❮ ᴛᴇsᴛɪɴɢ ᴘɪɴɢ ❯`,
    });
    let end = new Date().getTime()
    await m.client.sendMessage(m.message.peerId, {
      message: `ʟᴀᴛᴇɴᴄʏ: ${end-start} ᴍs`,
    });
})
Module({ pattern: 'id', fromMe: true, desc: 'Id command', use: 'utility' }, async (m,match) => {

    if(m.quoted.id){
      let id = Number((await m.client.getMessages(m.jid, {ids:m.quoted.id}))[0].fromId.userId.value)
      let username = await m.getUsername(id)
      return await m.send(`ID of ${username} is ${id}`)
    }
    let id = Number(m.jid.userId.value)
    let username = await m.getUsername(id)
    return await m.send(`ID of ${username} is ${id}`)
})
