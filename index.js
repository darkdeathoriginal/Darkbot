const { TelegramClient,Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events');
const { CustomFile } = require("telegram/client/uploads");
const input = require('input')
const fs = require('fs');
const simpleGit = require('simple-git');
const git = simpleGit();
require('dotenv').config();
const modules = [];
class AddCmd {
  constructor({ pattern, fromMe, desc, use }, callback) {
    this.pattern = pattern;
    this.fromMe = fromMe;
    this.desc = desc;
    this.use = use;
    this.callback = callback;
  }

  async handleEvent(event, client) {
    const message = event.message;
    const sender = await message.getSender();
    if(this.fromMe&&!sender.self)return
    const text = message.text.toLowerCase();

    let newMessage = {
      message: message,
      client: client,
    };
    newMessage.forwardMessage= async (from, id, to) => {
      await client.invoke(new Api.messages.ForwardMessages({
        silent: true,
        background: true,
        withMyScore: true,
        fromPeer: from,
        id: [id],
        randomId: [Math.floor(Math.random() * 1000000)],
        toPeer: to,
      }));
    }
    newMessage.getProfilePic = async(username)=>{
      try{
      let data = await client.invoke(
        new Api.photos.GetUserPhotos({
          userId: username,
          offset: 0,
          maxId: 0,
          limit: 100,
        })
      );
      const photo = data.photos[0]
      const bufff = photo.fileReference
      return await client.downloadMedia(photo, {
        workers: 12,
      })
      }
      catch(e){
        return e
      }
    }
    newMessage.getUsername = async(id =message.peerId )=>{
      try{
        return (await client.getEntity(id)).username
        }
        catch(e){
          throw(e)
        }
      
    }
    newMessage.updateProfilePicture = async(photo)=>{
      await client.invoke(new Api.photos.UpdateProfilePhoto({
        id:new Api.InputPhoto({
          id:photo.id,
          accessHash:photo.accessHash,
          fileReference:photo.fileReference
        })
        }));
      return true
      
    }
    newMessage.edit = async(text,id=message.id)=>{
      await client.invoke(new Api.messages.EditMessage({
        noWebpage: true,
        peer: message.peerId,
        id: id,
        message: text,
        }));
      return true
      
    }
    newMessage.messageData = async(id)=>{
      return await client.invoke(new Api.messages.GetMessages({
        id: [id],
        }));;
      
      
    }
    newMessage.send = async(text)=>{
      let a = await client.sendMessage(message.peerId, {
        message: text,
      })
      return a
    }
    newMessage.updatGroupImage = async(id)=>{
      try{
      const r1 = await client.getMessages(message.peerId, {
        ids: id
      });
      let a = await client.getEntity(message.peerId);
      if (r1[0]?.media?.photo) {
        await client.invoke(
          new Api.channels.EditPhoto({
            channel: await newMessage.getUsername(),
            photo: r1[0].media.photo
          })
        );
      }
      }catch(e){
        throw(e)
      }
    }
    newMessage.changeGroupTitle = async(username,text)=>{
      try{
        await client.invoke(
          new Api.channels.EditTitle({
            channel: username,
            title: text,
          })
        );
      }catch(e){
        throw(e)
      }
    }
    newMessage.jid = message.peerId
    newMessage.quoted =await message.replyTo || {}
    newMessage.quoted.id =await message.replyTo?.replyToMsgId || ""
    newMessage.sendMessage = async(id,obj)=>{
      try{
      if(obj.text){
        await client.sendMessage(id, {
          message: obj.text,
        })
      }
      else if(obj.image){
        if(obj.image.url){
          const result = new CustomFile("test.png",fs.statSync(obj.image.url).size,obj.image.url,)
          await client.sendFile(id, {file: result})
        }else{
          const result = new CustomFile("test.png",obj.image.length,"",obj.image)
          await client.sendFile(id, {file: result})
        }
      }
      else if(obj.video){
        if(obj.video.url){
          const result = new CustomFile("test.mp4",fs.statSync(obj.video.url).size,obj.video.url,)
          await client.sendFile(id, {file: result})
        }else{
          const result = new CustomFile("test.mp4",obj.video.length,"",obj.video)
          await client.sendFile(id, {file: result})
        }
      }
      else if(obj.document){
        if(obj.document.url){
          const result = new CustomFile(obj.fileName,fs.statSync(obj.document.url).size,obj.document.url,)
          await client.sendFile(id, {file: result,forceDocument:true})
        }else{
          const result = new CustomFile(obj.fileName,obj.document.length,"",obj.document)
          await client.sendFile(id, {file: result,forceDocument:true})
        }
      }
      else{
        console.log("invalid format")
      }
      }catch(e){
        throw(e)
      }
    }
    newMessage.waitForReply = async(id,text)=>{
      try{
      newMessage.sendMessage(id,{text:text})
      return new Promise((resolve) => {
        client.addEventHandler(async (ev) => {
          let msg = ev.message
          if(await newMessage.getUsername(msg.peerId)==await newMessage.getUsername(id)){
            resolve(msg.text)
          }
        }, new NewMessage({}));
      })
      }catch(e){
        throw(e)
      }
    }

    if (this.pattern === "message") {
      return await this.callback(newMessage);
    } else {
      const regex = new RegExp(`^\\.\\s*${this.pattern}`);
      const match = text.match(regex);
      
      if (match) {
        try{
        return await this.callback(newMessage,match);
        }catch(e){
          client.sendMessage(message.peerId,{message:e})
        }
      }
    }
  }
}

function Module(moduleConfig, callback) {
    const { pattern, fromMe, desc, use } = moduleConfig;
    const module = new AddCmd({ pattern, fromMe, desc, use }, callback);
    modules.push(module);
  }

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const session = process.env.SESSION?process.env.SESSION:""
const stringSession = new StringSession(session||"");

(async () => {
  console.log('Bot is starting...');

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  


  

  client.addEventHandler(async (event) => {
    for (const module of modules) {
      await module.handleEvent(event, client);
    }
  }, new NewMessage({}));

  await client.start({
    phoneNumber: async () => await input.text('number ?'),
    password: async () => await input.text('password?'),
    phoneCode: async () => await input.text('Code ?'),
    onError: (err) => console.log(err),
  });
  if(session ==""){
    let a = client.session.save()
    let file = await fs.readFileSync(".env","utf8")
    file+=`\nSESSION=${a}`
    fs.writeFileSync(".env",file)
  }
  console.log('Bot is ready.');
  await client.sendMessage('me', { message: 'Bot has been started..' });
  var commits = await git.log(['main' + '..origin/' + 'main']);
  var mss = '';
  if (commits.total != 0) {
    var changelog = "_Pending updates:_\n\n";
    for (var i in commits.all){
      changelog += `${(parseInt(i)+1)}• **${commits.all[i].message}**\n`
    }
    changelog+=`\n_Use ".update start" to start the update_`
    await client.sendMessage('me', { message: changelog });
  }


  
  
})();
Module({ pattern: 'start', fromMe: true, desc: 'Start command', use: 'utility' }, async (m) => {
    const sender = await m.message.getSender();
    await m.client.sendMessage(sender, {
      message: `Hi, your ID is ${m.message.senderId}`,
    });
  });

  module.exports = {
    Module,
    modules

  };
  const pluginFolder = "./plugins/";
  const files = fs.readdirSync(pluginFolder);

  files.forEach((file) => {
    if (file.endsWith('.js')) {
      const filePath = pluginFolder+file;
      require(filePath);
    }
  });