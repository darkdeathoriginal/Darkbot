const { Module, modules } = require("../index");
const { TelegramClient, Api } = require("telegram");
const { CustomFile } = require("telegram/client/uploads");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();
const { FancyRandom } = require("./utils/fancy");

Module(
  {
    pattern: "pp ?(.*)",
    fromMe: true,
    desc: "Get profile picture of a user",
    use: "utility",
  },
  async (m, match) => {
    if (!m.quoted) {
      return await m.send("Reply to a message to get the profile picture");
    }
    const quoted = await m.getQuoted();
    const photos = await m.client.getUserProfilePhotos(quoted.userId);
    for(let photo of photos){
      await m.client.sendMessage(m.jid, {
        file:photo,
    })
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
    text = "";
    for (let i of modules) {
      if (i.pattern&&i.pattern != "message") {
        text += i.pattern.split(" ?(.*)")[0] + "\n" + i.desc + "\n\n";
      }
    }
    await m.edit({text:FancyRandom(text)});
  }
);

Module(
  { pattern: "dl", fromMe: true, desc: "Downloads file", use: "utility" },
  async (m, match) => {
    const quoted = await m.getQuoted();
    let id = quoted.id;
    const result = await m.client.getMessages(m.jid, {
      ids: id,
    });
    const media = result[0];
    if (media) {
      const buffer = await m.client.downloadMedia(media, {
        workers: 12,
      });
      if (result[0]?.media?.photo) {
        await fs.writeFileSync("./temp/temp.jpeg", buffer);
      }
      if (result[0]?.media?.document) {
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
    const quoted = await m.getQuoted();
    let id = quoted.id;
    const result = await m.client.getMessages(m.jid, {
      ids: id,
    });
    const media = result[0];
    if (media) {
      const buffer = await m.client.downloadMedia(media, {
        workers: 14,
      });
      if (result[0].media.photo) {
        await m.client.send("me", { image: buffer });
      }
      if (result[0].media.document) {
        await m.client.send("me", { video: buffer });
      }
    }
  }
);
Module(
  { pattern: "scrambled ?(.*)", fromMe: false, desc: "game", use: "utility" },
  async (m, match) => {
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

    await m.client.send(m.jid, {
      text: `Guess the word: ${currentScrambledWord}`,
    });

    this.scrambled[m.jid].state = true;
    this.scrambled[m.jid].id = m.jid;
  }
);
Module(
  { on: "message", fromMe: true, desc: "Start command", use: "utility" },
  async (m, match) => {
    if (
      this.scrambled &&
      this.scrambled[m.jid].id === m.jid &&
      m.message.toLowerCase() === this.scrambled[m.jid].currentWord
    ) {
      console.log("test");
      await m.client.send(m.jid, {
        text: `you win`,
      });
      this.scrambled[m.jid].state = false;
    }
  }
);
Module(
  { on: "message", fromMe: true, desc: "Start command", use: "utility" },
  async (m, match) => {
    let text = m.message;
    if (text.startsWith(">")) {
      const util = require("util");
      try {
        let return_val = await eval(
          `(async () => { ${text.replace(">", "")} })()`
        );
        if (return_val && typeof return_val !== "string")
          return_val = util.inspect(return_val);
        if (return_val) {
          await m.client.sendMessage(m.jid, {
            message: return_val || "no return value",
          });
        }
      } catch (e) {
        await m.client.sendMessage(m.jid, {
          message: util.format(e),
        });
      }
    }
  }
);