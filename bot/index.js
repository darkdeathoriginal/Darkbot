const { bots } = require("./handler");
const fs = require("fs");

const botFolder = "./bot/bots/";
const files = fs.readdirSync(botFolder);

files.forEach((file) => {
  if (file.endsWith(".js")) {
    const filePath = "./bots/" + file;
    require(filePath);
  }
});
for(let bot of bots){
  bot.init()
}
