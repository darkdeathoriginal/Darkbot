const { Bot } = require("./utils/Bot")

const bots = []
function botHandler(object){
    const newBot = new Bot(object.BOT_TOKEN,object.name)
    for(let i of object.commands){
        newBot.addCommand(i)
    }
    bots.push(newBot)
}
module.exports = {botHandler,bots}