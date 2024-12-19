import { createBot, CreateClient } from "../../lib/createClient";
import Message from "../../lib/Message";
import { CallbackQuery, CallbackQueryEvent } from "telegram/events/CallbackQuery";
import { Api } from "telegram";
import { Command } from "../handler";
import Callback from "./Callback";
import { StringSession } from "telegram/sessions";
import { BotDb } from "../../modals/bot";
import { NewMessage, Raw } from "telegram/events";
import config from "../../config"
const { getSudo, DEVELOPMENT,apiId,apiHash } = config

export class Bot {
  BOT_TOKEN:string
  name:string
  modules:Command[]
  client!:CreateClient
  username!:string | undefined
  constructor(BOT_TOKEN:string, name:string) {
    this.BOT_TOKEN = BOT_TOKEN;
    this.name = name;
    this.modules = [];
  }
  getCommand(message:Api.Message):[string | undefined, [number, number] | undefined]{
    const text = message.message
    const [command, offsets] = message.entities?.reduce<[string | undefined, [number, number] | undefined]>(
      (prev, curr) => {        
        if (curr instanceof Api.MessageEntityBotCommand) {
          return [text.slice(curr.offset+1, curr.offset + curr.length), [curr.offset, curr.length]];
        }
        return prev;
      },
      [undefined, undefined]
    ) || [undefined, undefined];  
      
    if(!command) return [undefined,undefined]
    const [isCommand,username] = command?.split("@")
    if(username == this.username || !username){
      return [isCommand,offsets]
    }
    return [undefined,undefined]
  }
  async init() {
    console.log(`${this.name} is starting...`);
    await BotDb.sync();
    let session = "";
    const bot = await BotDb.findOne({ where: { token: this.BOT_TOKEN } });
    if (bot) session = bot.session;
    const stringSession = new StringSession(session);
    if(!apiId) throw new Error("Api id not found")
    if(!apiHash) throw new Error("Api Hash not found")
    this.client = await createBot(
      apiId,
      apiHash,
      this.BOT_TOKEN,
      stringSession
    );
    await this.setCommands();
    this.username = (await this.client.getMe()).username
    console.log(`${this.name} started!`);
    for(let module of this.modules){
      if(module.on && module.on == "start" && module.callback) module.callback(this)
    }
    try {
      if(!DEVELOPMENT) this.client.send(getSudo(),{text:`${this.name} started!`})
    } catch (error) {
      console.log(error);
    }
    session = (this.client.session.save() as unknown) as string
    if (!bot) this.saveSession(this.BOT_TOKEN, session);
    this.client.addEventHandler(async (event) => {
      let test = new Message(this.client, event.message);
      const [isCommand,offsets] = this.getCommand(event.message)
      
      const jid = Number(test.jid instanceof Api.PeerUser? test.jid.userId : test.jid)
      const sudo = Number(getSudo())
      for (let i of this.modules) {
        if (i.pattern && ((i.sudo && sudo == jid) || !i.sudo) && isCommand && offsets) {
          const regex = new RegExp(`^\/\\s*${i.pattern} ?(.*)`);
          const match = i.pattern == isCommand          
          const fullCommand = event.message.message.slice(offsets[0],offsets[1])
          const arr = event.message.message.split(fullCommand)
          if (match && i.on == "message") {
            i.callback(test, arr, this);
          }
        }
        
        if (
          i.pattern == undefined &&
          i.on == "message" &&
          ((i.sudo && sudo == jid) || !i.sudo)
        ) {
          i.callback(test, [], this);
        }
      }
    }, new NewMessage({}));
    this.client.addEventHandler(async (event:CallbackQueryEvent) => {
      const callback = new Callback(this.client,event.query);
      for(let module of this.modules){
        if(module.on && module.on == "callback_query" && module.callback){
          module.callback(callback, this.client)
        }
      }
    }, new CallbackQuery({}));
    await this.client.getMe();
    this.client.addEventHandler((event)=>{
      if (event instanceof Api.UpdateBotInlineQuery) {
        for(let module of this.modules){
          if(module.on && module.on == "inline_query" && module.callback){
            module.callback(event, this.client)
          }
        }
      }
    },new Raw({}))
  }
  addCommand(command:Command) {
    if(command.on === undefined){
      
      command.on = "message"
    }
    this.modules.push(command);
  }
  async saveSession(token:string, session:string) {
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
