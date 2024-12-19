import { CreateClient } from "src/lib/createClient"
import { Bot } from "./utils/Bot"
import Message from "src/lib/Message"
import { Api, client } from "telegram"
import Callback from "./utils/Callback";

export interface CommandBase {
    pattern?: string;
    description?: string;
    sudo?: boolean;
    dontAdd?: boolean;
}

export interface StartCommand extends CommandBase {
    on: "start";
    callback: (client: Bot) => void;
}
export interface CallbackCommand extends CommandBase {
    on: "callback_query";
    callback: (cb:Callback,client: CreateClient) => void;
}
export interface InlineCommand extends CommandBase {
    on: "inline_query";
    callback: (event:Api.UpdateBotInlineQuery,client: CreateClient) => void;
}
export interface MessageCommand extends CommandBase {
    on: "message" | undefined
    callback: (m: Message, match: string[], client: Bot) => void;
}

// Use a union type to combine the two
export type Command = StartCommand | MessageCommand | CallbackCommand | InlineCommand

interface BotDetails{
    name:string
    BOT_TOKEN:string
    commands:Command[]
}
export const bots:Bot[] = []
export function botHandler(object:BotDetails){
    const newBot = new Bot(object.BOT_TOKEN,object.name)
    for(let i of object.commands){
        newBot.addCommand(i)
    }
    bots.push(newBot)
}
module.exports = {botHandler,bots}