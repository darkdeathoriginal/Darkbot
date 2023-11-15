const {  Logger } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");
const fs = require("fs");
const simpleGit = require("simple-git");
const { LogLevel } = require("telegram/extensions/Logger");
const Message = require("./lib/Message");
const { createClient } = require("./lib/createClient");
const git = simpleGit();
require("dotenv").config();
const {apiId,apiHash,session} = require("./config")

const modules = [];

function Module(moduleConfig, callback) {
  modules.push({ ...moduleConfig, callback });
}
const stringSession = new StringSession(session || "");

(async () => {
  console.log("Bot is starting...");

  const client = createClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
    baseLogger: new Logger(LogLevel.ERROR),
  });

  client.addEventHandler(async (event) => {
    let test = new Message(client,event.message);
    const message = event.message.message;
    const sender = await event.message.getSender();

    if (message) {
      for (const module of modules) {
        if((module.fromMe&&sender.self)||!module.fromMe){
          const regex = new RegExp(`^\\.\\s*${module.pattern}`);
          const match = message.match(regex);
        if (match) {
          module.callback(test, match);
        }
        }
        
      }
    }
    for (const module of modules) {
      if (module.pattern == "message") {
        if((module.fromMe&&sender.self)||!module.fromMe){
          module.callback(test);
        }
      }
    }
  }, new NewMessage({}));
  await client.start({
    phoneNumber: async () => await input.text("number ?"),
    password: async () => await input.text("password?"),
    phoneCode: async () => await input.text("Code ?"),
    onError: (err) => console.log(err),
  });
  if (session == "") {
    let a = client.session.save();
    let file = await fs.readFileSync(".env", "utf8");
    file += `\nSESSION=${a}`;
    fs.writeFileSync(".env", file);
  }
  console.log("Bot is ready.");
  require("./bot/index")
  await client.sendMessage("me", { message: "Bot has been started.." });
  var commits = await git.log(["main" + "..origin/" + "main"]);
  var mss = "";
  if (commits.total != 0) {
    var changelog = "_Pending updates:_\n\n";
    for (var i in commits.all) {
      changelog += `${parseInt(i) + 1}• **${commits.all[i].message}**\n`;
    }
    changelog += `\n_Use ".update start" to start the update_`;
    await client.sendMessage("me", { message: changelog });
  }
})();
Module(
  { pattern: "start", fromMe: true, desc: "Start command", use: "utility" },
  async (m) => {
    const sender = await m.message.getSender();
    await m.client.sendMessage(sender, {
      message: `Hi, your ID is ${m.message.senderId}`,
    });
  }
);

module.exports = {
  Module,
  modules,
};
const pluginFolder = "./plugins/";
const files = fs.readdirSync(pluginFolder);

files.forEach((file) => {
  if (file.endsWith(".js")) {
    const filePath = pluginFolder + file;
    require(filePath);
  }
});
