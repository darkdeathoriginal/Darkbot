import { NewMessage, NewMessageEvent } from "telegram/events";
import fs from "fs"
import config from "./config";
import { Api, Logger } from "telegram";
import { StringSession } from "telegram/sessions";
import simpleGit from "simple-git";
import { LogLevel } from "telegram/extensions/Logger";
import Message from "./lib/Message";
import { CreateClient } from "./lib/createClient";

const input = require("input");
const git = simpleGit();
const { apiId, apiHash, session, setSudo,DATABASE } = config


if(!apiId) throw new Error("Api id not found")
if(!apiHash) throw new Error("Api Hash not found")

  interface ModuleBase {
    pattern?: string; 
    on?: "message";
    fromMe: boolean;
    desc: string;
    use: string;
  }
  
  interface ModuleCommand extends ModuleBase {
    pattern: string; 
    on?: undefined; 
    callback: (m: Message, match: RegExpMatchArray) => void; 
  }
  
  interface ModuleMessage extends ModuleBase {
    on: "message"; 
    callback: (m: Message) => void; 
  }
  
  type ModuleConfig = ModuleCommand | ModuleMessage;
  
  type Callback = ModuleCommand["callback"] | ModuleMessage["callback"];
  
export const modules: ModuleConfig[] = [];
  
  export function Module(config: ModuleBase, callback: Callback): void {
    if (config.on === "message") {
      const moduleConfig: ModuleMessage = {
        ...config,
        on: "message",
        callback: callback as ModuleMessage["callback"],
      };
      modules.push(moduleConfig);
    } else {
      if (!config.pattern) {
        throw new Error("Command-based modules must specify a pattern.");
      }
      const moduleConfig: ModuleCommand = {
        ...config,
        on: undefined,
        pattern: config.pattern,
        callback: callback as ModuleCommand["callback"],
      };
      modules.push(moduleConfig);
    }
  }
  
const stringSession = new StringSession(session || "");

(async () => {
  console.log("Bot is starting...");
  await DATABASE.authenticate()
  console.log("Database connected");
  
  const client = new CreateClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
    baseLogger: new Logger(LogLevel.ERROR),
  });

  client.addEventHandler(async (event:NewMessageEvent) => {
    let test = new Message(client, event.message);
    const message = event.message.message;
    const sender = await event.message.getSender();
    if (message && sender instanceof Api.User) {
      for (const module of modules) {
        if ((module.fromMe && sender.self) || !module.fromMe) {
          const regex = new RegExp(`^\\.\\s*${module.pattern}`);
          const match = message.match(regex);
          if (match) {
            module.callback(test, match);
          }
        }
      }
    }
    for (const module of modules) {
      if (module.on && sender instanceof Api.User && module.on == "message" && ((module.fromMe && sender.self) || !module.fromMe)) {
        module.callback(test);
      }
    }
  }, new NewMessage({}));
  await client.start({
    phoneNumber: async () => await input.text("number ?"),
    password: async () => await input.text("password?"),
    phoneCode: async () => await input.text("Code ?"),
    onError: (err:Error) => console.log(err),
  });
  if (session == "") {
    let a = client.session.save();
    let file = await fs.readFileSync(".env", "utf8");
    file += `\nSESSION=${a}`;
    fs.writeFileSync(".env", file);
  }
  console.log("Bot is ready.");
  const me = await client.getMe();
  setSudo(me.id);
  require("./bot/index");
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
  async (m,match) => {
    await m.client.sendMessage(m.jid, {
      message: `Hi, your ID is ${m.data.senderId}`,
    });
  }
);

module.exports = {
  Module,
  modules,
};
const pluginFolder = __dirname+"/plugins/";
const files = fs.readdirSync(pluginFolder);

files.forEach((file:string) => {
  if (file.endsWith(".js") || file.endsWith(".ts")) {
    const filePath = pluginFolder + file;
    require(filePath);
  }
});
