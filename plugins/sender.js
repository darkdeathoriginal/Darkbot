const { Module, modules } = require("../index");
const axios = require("axios");
const webUrl = process.env.WEB_URL
const config = require('../config');
const { DataTypes } = require('sequelize');

const chatDb = config.DATABASE.define('chat', {
    from: {
        type: DataTypes.STRING,
        allowNull: false
    },
    to: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

async function createTable(from, to) {
    var chats = await chatDb.findAll({
        where: {from: from}
    });

    if (chats.length >= 1) {
        return false;
    } else {
        return await chatDb.create({ from: from, to: to });
    }
}
async function deleteTable(from) {
    const deletedRows = await chatDb.destroy({
        where: { from: from }
    });
    
    return deletedRows > 0;
}


Module(
    {
      pattern: "sender ?(.*)",
      fromMe: true,
      desc: "whatsapp sender",
      use: "utility",
    },
    async (m, match) => {
        await chatDb.sync();
        if(match[1]=="get"){
          let a = ''
          let array = (await chatDb.findAll()).map((e) => {
              return { from: e.dataValues.from, to: e.dataValues.to };
            });
          for(let i of array){
              a+=`from: ${i.from}\nto: ${i.to}`
          }
          return await m.send(a)
      }
        let a = await m.waitForReply(m.jid,"Send the username of the chat you want to forward messages from.")
        let b = await m.waitForReply(m.jid,"Send the Jid of the chat you want to forward messages to.")
        await createTable(a,b)
        m.send('succesfully set sender')
    }
  );
  Module({ pattern: 'del ?(.*)', fromMe: true, desc: 'Ping command', use: 'utility' }, async (m,match) => {
    const from =match[1]
    await deleteTable(from).then(m.send("succesfully deleted.."))
})
  Module({
    pattern: 'message',
    fromMe: false
    }, (async (m, match) => {
    let username = await m.getUsername(m.jid)
    let array = (await chatDb.findAll()).map(e=>{
        return ({from:e.dataValues.from,to:e.dataValues.to})
        })
    for(let i of array){
        if(i.from == username){
            let id = m.message.id;
          const result = await m.client.getMessages(m.jid, {
            ids: id,
          });
          const media = result[0];
          if (media) {
            const buffer = await m.client.downloadMedia(media, {
              workers: 14,
            });
            if (result[0].media.photo) {
      
            const postData = {
              "jid": i.to,
              "buffer": buffer,
              "caption":result[0].message || ""
          }
      
      
            axios.post(webUrl, postData)
              .then(response => console.log(response.data))
              .catch(error => console.log(error));
            }
          }
          }
            
    }
        
    }));