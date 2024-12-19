import { ExternalBotDb } from "../modals/externalBot";
import { bots } from "./handler";

const fs = require("fs");
const botFolder = __dirname+"/bots/";
const axios = require("axios");

(async () => {
  await ExternalBotDb.sync();
  const all = await ExternalBotDb.findAll();
  for (let i of all) {
    if (!fs.existsSync(__dirname + `/bots/${i.name}.js`)) {
      let url
      try {
        url = new URL(i.url);
        if (
          url?.host === "gist.github.com" ||
          url?.host === "gist.githubusercontent.com"
        ) {
          url = !url?.toString().endsWith("raw")
            ? url.toString() + "/raw"
            : url.toString();
        } else {
          url = url.toString();
        }
      } catch {
        console.log("Invalid URL");
      }
      
      try {
        var response = await axios(url + "?timestamp=" + new Date());
      } catch (e) {
        console.log(e);
      }
      response.data = response.data.replace(
        "BOT_TOKEN",
        `BOT_TOKEN:"${i.token}"`
      );
      fs.writeFileSync(__dirname + `/bots/${i.name}.js`, response.data);
    }
  }
  const files = fs.readdirSync(botFolder);
  files.forEach((file:string) => {
    if (file.endsWith(".js") ||file.endsWith(".ts")) {
      const filePath = "./bots/" + file;
      require(filePath);
    }
  });
  for (let bot of bots) {
    bot.init();
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
})();
