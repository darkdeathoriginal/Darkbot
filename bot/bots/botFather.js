const { botHandler } = require("../handler");
const { BOT_TOKEN } = require("../../config");
const { bots } = require("../handler");
const { startCommand, pingCommand } = require("../utils/defaultCommands");
const axios = require("axios");
const fs = require("fs");
const ExternalBotDb = require("../../modals/externalBot");
const { ButtonBuilder } = require("../utils/buttonBuilder");
const { Button } = require("telegram/tl/custom/button");

let state = false;
let token;
let timeout;
botHandler({
  name: "BotFather",
  BOT_TOKEN,
  commands: [
    pingCommand,
    startCommand,
    {
      pattern: "addbot",
      description: "external bot adder",
      sudo: true,
      callback: async (m, match) => {
        state = "token";
        timeout = setTimeout(timeoutMessage, 60000, m);
        await m.send("Send me a bot token");
      },
    },
    {
      pattern: "updatebot",
      description: "update external bot",
      sudo: true,
      callback: async (m) => {
        let bots = await ExternalBotDb.findAll();
        if (bots.length < 1) return await m.send("No External bots found");
        let msg = "Bots:\n";
        const button = new ButtonBuilder();
        for (let bot of bots) {
          button.add(
            Button.inline(bot.name, Buffer.from("updateBot-" + bot.name))
          );
        }
        await m.client.sendMessage(m.jid, {
          message: "Select bot to update",
          buttons: button.build(),
        });
      },
    },
    {
      on: "message",
      sudo: true,
      callback: async (m, match) => {
        if (!state || m.message === "/addbot") return;
        clearTimeout(timeout);
        if (state == "token") {
          state = "link";
          token = m.message;
          timeout = setTimeout(timeoutMessage, 60000, m);
          return await m.send("Send bot gist url");
        }
        if (state == "link") {
          await ExternalBotDb.sync();
          state = false;
          match = m.message;
          let links = match.match(/\bhttps?:\/\/\S+/gi);
          for (let link of links) {
            try {
              var url = new URL(link);
            } catch {
              return await m.send("invalid url");
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
            } catch {
              return await m.send("invalid url");
            }
            let plugin_name = /name: ["'](.*)["'],/g.exec(response.data);
            var plugin_name_temp = response.data.match(/name: ["'](.*)["'],/g)
              ? response.data
                  .match(/name: ["'](.*)["'],/g)
                  ?.map((e) =>
                    e.replace("pattern", "").replace(/[^a-zA-Z]/g, "")
                  )
              : "temp";
            try {
              plugin_name = plugin_name[1].split(" ")[0];
            } catch {
              return await m.send("_Invalid plugin. No plugin name found!_");
            }
            response.data = response.data.replace(
              "BOT_TOKEN",
              `BOT_TOKEN:"${token}"`
            );
            fs.writeFileSync(
              __dirname + "/" + plugin_name + ".js",
              response.data
            );
            plugin_name_temp =
              plugin_name_temp.length > 1
                ? plugin_name_temp.join(", ")
                : plugin_name;
            try {
              require("./" + plugin_name);
              for (let i of bots) {
                if (i.name == plugin_name) {
                  await i.init();
                }
              }
            } catch (e) {
              fs.unlinkSync(__dirname + "/" + plugin_name + ".js");
              return await m.send("Error in plugin\n" + e);
            }
            await m.send(plugin_name + " installed.");
            await ExternalBotDb.create({
              url: url,
              name: plugin_name,
              token,
            });
          }
          return;
        }
      },
    },
    {
      pattern: "removebot",
      sudo: true,
      description: "remove external bot",
      callback: async (m, match) => {
        let bots = await ExternalBotDb.findAll();
        if (bots.length < 1) return await m.send("No External bots found");
        let msg = "Bots:\n";
        const button = new ButtonBuilder();
        for (let bot of bots) {
          button.add(
            Button.inline(bot.name, Buffer.from("removebot-" + bot.name))
          );
        }
        await m.client.sendMessage(m.jid, {
          message: "Select bot to remove",
          buttons: button.build(),
        });
      },
    },
    {
      on: "message",
      sudo: true,
      callback: async (m) => {
        let text = m.message;
        if (text.startsWith("<")) {
          const util = require("util");
          try {
            let return_val = await eval(
              `(async () => { ${text.replace("<", "")} })()`
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
      },
    },
    {
      on: "callback_query",
      callback: async (m) => {
        if (m.query.startsWith("removebot-")) {
          await m.answer();
          const name = m.query.split("-")[1];
          await ExternalBotDb.sync();
          var plugin = await ExternalBotDb.findAll({
            where: {
              name: name,
            },
          });
          if (plugin.length < 1) {
            return await m.send("plugin not found");
          } else {
            await plugin[0].destroy();
            const Message = name + " removed succesfully";
            delete require.cache[
              require.resolve(__dirname + "/" + name + ".js")
            ];
            await fs.unlinkSync(__dirname + "/" + name + ".js");
            await m.send(Message);
            await m.send("Restarting bot...");
            process.exit(1);
          }
          return;
        }
        if(m.query.startsWith("updateBot-")){
          await m.answer();
          const name = m.query.split("-")[1];
          await ExternalBotDb.sync();
          var plugin = await ExternalBotDb.findAll({
            where: {
              name: name,
            },
          });
          if (plugin.length < 1) {
            return await m.send("plugin not found");
          } else {
            delete require.cache[
              require.resolve(__dirname + "/" + name + ".js")
            ];
            await fs.unlinkSync(__dirname + "/" + name + ".js");
            await m.send("updating...");
            await m.send("Bot will be restarted");
            process.exit(1);
          }
        }
      },
    },
  ],
});

async function timeoutMessage(m) {
  await m.send("Time out");
  state = false;
}
