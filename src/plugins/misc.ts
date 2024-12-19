import axios from "axios";
import {Module, modules} from ".."
import { TelegramClient, Api } from "telegram"
import { CustomFile }from "telegram/client/uploads"
import fs from "fs"
import { FancyRandom } from "./utils/fancy";
import util from "util"

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
    if(!quoted) return await m.reply({
      message:"Cannot find quoted message"
    })
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
    let text = "";
    for (let i of modules) {
      if (i.pattern&&i.pattern != "message") {
        text += i.pattern.split(" ?(.*)")[0] + "\n" + i.desc + "\n\n";
      }
    }
    if(!m.id) return await m.reply({
      message:"Cannot find message id"
    })
    await m.client.editMessage(m.jid,{
      message:m.id,
      text:FancyRandom(text)
    })
  }
);

Module(
  { pattern: "dl", fromMe: true, desc: "Downloads file", use: "utility" },
  async (m, match) => {
    let id = m.quoted;
    const result = await m.client.getMessages(m.jid, {
      ids: id,
    });
    const media = result[0];
    if (media) {
      const buffer = await m.client.downloadMedia(media, {
      });
      const tojson = result[0].media?.toJSON()
      if(!tojson) return 
      if ("photo" in tojson && buffer instanceof Buffer) {
        await fs.writeFileSync("./temp/temp.jpeg", buffer);
      }
      if ("document" in tojson && buffer instanceof Buffer) {
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
    let id = m.quoted;
    const result = await m.client.getMessages(m.jid, {
      ids: id,
    });
    const media = result[0];
    if (media) {
      const buffer = await m.client.downloadMedia(media, {
      });
      const tojson = result[0].media?.toJSON()
      if(!tojson) return 
      if ("photo" in tojson && buffer instanceof Buffer) {
        await m.client.send("me", { image: buffer });
      }
      if ("video" in tojson && buffer instanceof Buffer) {
        await m.client.send("me", { video: buffer });
      }
    }
  }
);
interface ScrambledEntry {
  currentWord?: string;
  state?: boolean;
  id?: number; 
}

interface Data {
  scrambled: {
    [jid: string]: ScrambledEntry;
  };
}

const data: Data = { scrambled: {} };

Module(
  { pattern: "scrambled ?(.*)", fromMe: false, desc: "game", use: "utility" },
  async (m, match) => {
    let jid = Number(m.jidValue)
    if(!jid) return await m.reply({
      message:"Could not find Chat ID"
    })
    
    data.scrambled = data.scrambled ? data.scrambled : {};
    data.scrambled[jid] = data.scrambled[jid] ? data.scrambled[jid] : {};

    const a = (await axios(`https://fruityvice.com/api/fruit/all`)).data;
    let n = Math.floor(Math.random() * a.length);
    const word = a[n].name.toLowerCase();
    data.scrambled[jid].currentWord = word;
    const currentScrambledWord = word
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    await m.client.send(m.jid, {
      text: `Guess the word: ${currentScrambledWord}`,
    });

    data.scrambled[jid].state = true;
    data.scrambled[jid].id = jid;
  }
);
Module(
  { on: "message", fromMe: true, desc: "Start command", use: "utility" },
  async (m, match) => {
    let jid = Number(m.jidValue)
    if(!jid) return
    if (
      data.scrambled &&
      data.scrambled[jid]?.id === jid &&
      m.message.toLowerCase() === data.scrambled[jid].currentWord
    ) {
      await m.client.send(m.jid, {
        text: `you win`,
      });
      data.scrambled[jid].state = false;
    }
  }
);
Module(
  { on: "message", fromMe: true, desc: "Start command", use: "utility" },
  async (m, match) => {
    let text = m.data.text;
    if (text.startsWith(">")) {
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