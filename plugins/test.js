const { Module, modules } = require("../index");
const { TelegramClient, Api } = require("telegram");
const { CustomFile } = require("telegram/client/uploads");
const axios = require("axios");
const fs = require("fs");
require('dotenv').config();
const {FancyRandom} = require("./utils/fancy");
const webUrl = process.env.WEB_URL


Module(
  {
    pattern: "pp ?(.*)",
    fromMe: true,
    desc: "Get profile picture of a user",
    use: "utility",
  },
  async (m, match) => {
    let id = m.quoted.id;
    const r1 = await m.client.getMessages(m.jid, {
      ids: id
    });
    if (r1[0]?.media?.photo) {
      await m.updateProfilePicture(r1[0].media.photo);
      return await m.send("Profile picture updated")
    }
    let a =(await m.client.getMessages(m.jid, {ids:m.quoted.id}))[0].fromId
    const bufferData = await m.client.downloadProfilePhoto(a,{isBig:true})
    if (bufferData) {

      await m.sendMessage(m.jid,{image:bufferData})
    } else {
      await m.client.sendMessage(m.message.peerId, {
        message: "Profile picture not found",
      });
    }
  }
);
Module(
  {
    pattern: "reboot ?(.*)",
    fromMe: true,
    desc: "restarts the bot",
    use: "utility",
  },
  async (m, match) => {
    // Handle start command logic here
    process.exit(0);
  }
);
Module(
  {
    pattern: "list ?(.*)",
    fromMe: true,
    desc: "List commands",
    use: "utility",
  },
  async (m, match) => {
    // Handle start command logic here
    const sender = await m.message.getSender();
    text = "";
    for (let i of modules) {
      if (i.pattern != "message") {
        text += i.pattern.split(" ?(.*)")[0] + "\n" + i.desc + "\n\n";
      }
    }
    await m.edit(FancyRandom(text));
  }
);

Module(
  { pattern: "dl", fromMe: true, desc: "Downloads file", use: "utility" },
  async (m, match) => {


    let id = m.quoted.id;
    const result = await m.client.getMessages(m.jid, {
      ids: id, 
    });
    const media = result[0];
    console.log(result[0].media);
    if (media) {
      const buffer = await m.client.downloadMedia(media, {
        workers: 12,
      });
      if (result[0].media.photo) {
        await fs.writeFileSync("./temp/temp.jpeg", buffer);
      }
      if (result[0].media.document) {
        await fs.writeFileSync("./temp/temp.mp4", buffer);
      }
    }
  }
);
Module(
  {
    pattern: "save",
    fromMe: true,
    desc: "saves file to saved file",
    use: "utility",
  },
  async (m, match) => {
    let id = m.quoted.id;
    const result = await m.client.getMessages(m.jid, {
      ids: id,
    });
    const media = result[0];
    if (media) {
      const buffer = await m.client.downloadMedia(media, {
        workers: 14,
      });
      if (result[0].media.photo) {
        await m.sendMessage("me",{image:buffer})
      }
      if (result[0].media.document) {
        await m.sendMessage("me",{video:buffer})
      }
    }
  }
);
Module(
  {
    pattern: "quote ?(.*)",
    fromMe: true,
    desc: " Random anime quote ",
    use: " utility ",
  },
  async (m, match) => {
    let url = "https://kyoko.rei.my.id/api/quotes.php";

    let json = (await axios(url)).data;
    let anime = json.apiResult[0].character;
    let quote = json.apiResult[0].english
    await m.send(`${quote}\n؜${anime}-`);
  }
);
Module(
  { pattern: "scrambled ?(.*)", fromMe: false, desc: "game", use: "utility" },
  async (m, match) => {
    m.jid = 1;
    this.scrambled = this.scrambled ? this.scrambled : {};
    this.scrambled[m.jid] = this.scrambled[m.jid] ? this.scrambled[m.jid] : {};

    const a = (await axios(`https://fruityvice.com/api/fruit/all`)).data;
    let n = Math.floor(Math.random() * a.length);
    const word = a[n].name.toLowerCase();
    this.scrambled[m.jid].currentWord = word;
    const currentScrambledWord = word
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    await m.client.sendMessage(m.message.peerId, {
      message: `Guess the word: ${currentScrambledWord}`,
    });

    this.scrambled[m.jid].state = true;
    this.scrambled[m.jid].id = m.jid;
  }
);
Module(
  { pattern: "message", fromMe: true, desc: "Start command", use: "utility" },
  async (m, match) => {
    m.jid = 1;
    if (
      this.scrambled &&
      this.scrambled[m.jid].id === m.jid &&
      m.message.message.toLowerCase() === this.scrambled[m.jid].currentWord
    ) {
      console.log("test");
      await m.client.sendMessage(m.message.peerId, {
        message: `you win`,
      });
      this.scrambled[m.jid].state = false;
    }
  }
);
Module(
  { pattern: "message", fromMe: true, desc: "Start command", use: "utility" },
  async (m, match) => {
    let text = m.message.message;
    if (text.startsWith(">")) {
      const util = require("util");
      const js = (x) => JSON.stringify(x, null, 2);
      try {
        let return_val = await eval(
          `(async () => { ${text.replace(">", "")} })()`
        );
        if (return_val && typeof return_val !== "string")
          return_val = util.inspect(return_val);
        if (return_val) {
        await m.client.sendMessage(m.message.peerId, {
          message: return_val || "no return value",
        });};
      } catch (e) {
        if (e) {
          await m.client.sendMessage(m.message.peerId, {
            message: util.format(e),
          });}
      }
    }
  }
);
Module(
  {
    pattern: "search ?(.*)",
    fromMe: true,
    desc: " Telegram file searcher ",
    use: " utility ",
  },
  async (m, match) => {
    const article = await m.client.inlineQuery("DSMultiFunctionalBot", match[1]);
    this.search = this.search?this.search:{}
    let data = {}
    let text=`showing result for ${match[1]}\n\n`
    let n=1;
    // let array = article.slice(0,article.length<20?article.length-1:20)
    for(let i of article){
      if(i.result.document){
        data[n]=i.result.document
        text+=n+", "+i.result.title+"\n"
        n++;

      }
    }
    this.search[m.jid] = {}
    if(article.length>20){
      text+="0, More\n"
      this.search[m.jid].next = article.slice(19,article.length-1)
    }
    text+="\nReply with the number to get the file."
    this.search[m.jid].data = data
    let a = await m.send(text)
    this.search[m.jid].key = a
  }
);

Module({
pattern: 'message',
fromMe: true
}, (async (m, match) => {
      if(!m.quoted || !this.search || this.search[m.jid]?.key.id != m?.quoted?.id) return;
      var no = /\d+/.test(m.message.message) ? m.message.message.match(/\d+/)[0] : false
      if (!no) throw "_Reply must be  a number_";
      let search = this.search[m.jid]
      if(!search.data[no]) return await m.send("invalid number")
      m.client.sendMessage(m.jid,{file:search.data[no]})
      
}));
        
Module(
  {
    pattern: "test ?(.*)",
    fromMe: true,
    desc: " Test plugin ",
    use: " utility ",
  },
  async (m, match) => {
    await m.send(await m.waitForReply("me",match[1]))
  }
);
Module(
  {
    pattern: "send ?(.*)",
    fromMe: true,
    desc: " telegram to whatsapp image sender ",
    use: " utility ",
  },
  async (m, match) => {
    let id = m.quoted.id;
    const result = await m.client.getMessages(m.jid, {
      ids: id,
    });
    const media = result[0];
    if (media) {
      const buffer = await m.client.downloadMedia(media, {
        workers: 14,
      });
      if (result[0].media.photo) {
        let caption = result[0].message
        if(result[0]?.replyMarkup?.rows[0]?.buttons){
          for(let i of result[0].replyMarkup.rows[2]?result[0].replyMarkup.rows[1].buttons:result[0].replyMarkup.rows[0].buttons){
            caption += `\n${i.text} : ${i.url}`
          }
        }
      const postData = {
        "jid": match[1]||"919072215994@s.whatsapp.net",
        "buffer": buffer,
        "caption":caption || ""
    }


      axios.post(webUrl, postData)
        .then(response => m.send(response.data))
        .catch(error => m.send(error));
      }
    }
  }
);

