const { bots } = require("./handler");
const fs = require("fs");
const botFolder = "./bot/bots/";
const ExternalBotDb = require("../modals/externalBot");
const axios = require("axios");

(async () => {
  await ExternalBotDb.sync();
  const all = await ExternalBotDb.findAll();
  for (let i of all) {
    if (!fs.existsSync(__dirname + `/bots/${i.name}.js`)) {
      try {
        var url = new URL(i.url);
      } catch {
        console.log("Invalid URL");
      }
      if (
        url.host === "gist.github.com" ||
        url.host === "gist.githubusercontent.com"
      ) {
        url = !url?.toString().endsWith("raw")
          ? url.toString() + "/raw"
          : url.toString();
      } else {
        url = url.toString();
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
  files.forEach((file) => {
    if (file.endsWith(".js")) {
      const filePath = "./bots/" + file;
      require(filePath);
    }
  });
  for (let bot of bots) {
    bot.init();
  }
})();
