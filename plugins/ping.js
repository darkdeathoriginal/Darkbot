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
    // Handle start command logic here
    const sender = await m.message.getSender()
    console.log(await m.message);
    console.log(sender);
})
