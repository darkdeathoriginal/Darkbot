const { Module, modules } = require("../index");
const { TelegramClient, Api } = require("telegram");
const { CustomFile } = require("telegram/client/uploads");
const axios = require("axios");
const fs = require("fs");
const {FancyRandom} = require("./utils/fancy");


Module(
  {
    pattern: "pp ?(.*)",
    fromMe: true,
    desc: "Get profile picture of a user",
    use: "utility",
  },
  async (m, match) => {
    let a = await m.messageData(m.message.replyTo.replyToMsgId)
    let id = m.message.replyTo.replyToMsgId;
    const r1 = await m.client.getMessages(m.message.peerId, {
      ids: id
    });
    if (r1[0]?.media?.photo) {
      await m.updateProfilePicture(r1[0].media.photo);
      return await m.client.sendMessage(m.message.peerId, {
        message: `Profile picture updated`,
      });
    }
    
    const bufferData = await m.getProfilePic(a.users[0].username);
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
    // Handle start command logic here
    const sender = await m.message.getSender();
    let id = m.message.replyTo.replyToMsgId;
    const result = await m.client.getMessages(m.message.peerId, {
      ids: id, // the id of the message you want to download
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
    // Handle start command logic here
    const sender = await m.message.getSender();
    let id = m.message.replyTo.replyToMsgId;
    const result = await m.client.getMessages(m.message.peerId, {
      ids: id, // the id of the message you want to download
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
    let url = "https://animechan.vercel.app/api/random";

    let json = (await axios(url)).data;
    let anime = json.character;
    let quote = json.quote;
    await m.client.sendMessage(m.message.peerId, {
      message: `${quote}\n؜${anime}-`,
    });
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

