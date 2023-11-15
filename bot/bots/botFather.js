const { botHandler } = require("../handler");
const { apiId, apiHash, BOT_TOKEN } = require("../../config");
const { startCommand, pingCommand } = require("../utils/defaultCommands");
const axios = require("axios");
const fs = require("fs");
const ExternalBotDb = require("../../modals/externalBot");

let state = false;
let token;
botHandler({
  name: "BotFather",
  apiId,
  apiHash,
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
        await m.send("Send me a bot token");
      },
    },
    {
      on: "message",
      sudo: true,
      callback: async (m, match) => {
        if (!state || m.message === "/addbot") return;
        if (state == "token") {
          state = "link";
          token = m.message;
          return await m.send("Send bot gist url");
        }
        if (state == "remove") {
          state = false;
          await ExternalBotDb.sync();
          const name = m.message;
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
            await m.send(Message);
            delete require.cache[
              require.resolve(__dirname + "/" + name + ".js")
            ];
            fs.unlinkSync(__dirname + "/" + name + ".js");
          }
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
                  .map((e) =>
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
            } catch (e) {
              fs.unlinkSync(__dirname + "/" + plugin_name + ".js");
              return await m.send("Error in plugin\n" + e);
            }
            await m.send(plugin_name_temp + " installed.");
            await ExternalBotDb.create({
              url: url,
              name: plugin_name_temp,
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
        for (let bot of bots) {
          msg += `${bot.name}\n`;
        }
        await m.send(msg);
        state = "remove";
        await m.send("Send bot name");
      },
    },
  ],
});
