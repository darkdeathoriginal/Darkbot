const { StringSession } = require("telegram/sessions");
const BotDb = require("../../modals/bot");
const { createBot } = require("../../lib/createClient");
const Message = require("../../lib/Message");
const { NewMessage } = require("telegram/events");
const { Api } = require("telegram");
const { getSudo, DEVELOPMENT } = require("../../config");
const {apiId,apiHash} = require("../../config")

class Bot {
  constructor(BOT_TOKEN, name) {
    this.BOT_TOKEN = BOT_TOKEN;
    this.name = name;
    this.modules = [];
  }
  async init() {
    console.log(`${this.name} is starting...`);
    await BotDb.sync();
    let session = "";
    const bot = await BotDb.findOne({ where: { token: this.BOT_TOKEN } });
    if (bot) session = bot.session;
    const stringSession = new StringSession(session);

    this.client = await createBot(
      apiId,
      apiHash,
      this.BOT_TOKEN,
      stringSession
    );
    await this.setCommands();
    console.log(`${this.name} started!`);
    for(let module of this.modules){
      if(module.on && module.on == "start" && module.callback) module.callback(this.client)
    }
    try {
      if(!DEVELOPMENT) this.client.send(getSudo(),{text:`${this.name} started!`})
    } catch (error) {
      console.log(error);
    }
    session = this.client.session.save();
    if (!bot) this.saveSession(this.BOT_TOKEN, session);
    this.client.addEventHandler(async (event) => {
      let test = new Message(this.client, event.message);
      for (let i of this.modules) {
        if (i.pattern && ((i.sudo && getSudo() == test.jid) || !i.sudo)) {
          const regex = new RegExp(`^\/\\s*${i.pattern} ?(.*)`);
          const match = event.message?.message?.match(regex);

          if (match) {
            i.callback(test, match, this);
          }
        }
        if (
          i.on &&
          i.on == "message" &&
          ((i.sudo && getSudo() == test.jid) || !i.sudo)
        ) {
          i.callback(test, [], this);
        }
      }
    }, new NewMessage({}));
  }
  addCommand(command) {
    this.modules.push(command);
  }
  async saveSession(token, session) {
    await BotDb.create({ token, session });
  }
  async setCommands() {
    const commands = [];
    for (let i of this.modules) {
      if (i.pattern && i.description&& !i.dontAdd) {
        commands.push(
          new Api.BotCommand({
            command: i.pattern,
            description: i.description,
          })
        );
      }
    }
    await this.client.invoke(
      new Api.bots.SetBotCommands({
        scope: new Api.BotCommandScopeDefault(),
        langCode: "en",
        commands,
      })
    );
  }
}

exports.Bot = Bot;
