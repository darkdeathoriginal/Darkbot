import axios from "axios";
import { Module } from "../";
import Message from "../lib/Message";
import { ExternalPluginDb } from "../modals/externalPlugins";
import fs from "fs"

Module(
  {
    pattern: "install ?(.*)",
    fromMe: true,
    use: "owner",
    desc: "plugin installer",
  },
  async (message, match) => {
    const matchValue = match[1];
    if (!match || !/\bhttps?:\/\/\S+/gi.test(matchValue))
      return await message.send("need url");
    await ExternalPluginDb.sync();
    let links = matchValue.match(/\bhttps?:\/\/\S+/gi);
    if(!links) return await message.send("Cannot find url")
    for (let link of links) {
      let urlString
      try {
        var url = new URL(link);
      } catch {
        return await message.send("invalid url");
      }
      if (
        url.host === "gist.github.com" ||
        url.host === "gist.githubusercontent.com"
      ) {
        urlString = !url?.toString().endsWith("raw")
          ? url.toString() + "/raw"
          : url.toString();
      } else {
        urlString = url.toString();
      }
      try {
        var response = await axios(urlString + "?timestamp=" + new Date());
      } catch {
        return await message.send("invalid url");
      }
      let plugin_name = /pattern: ["'](.*?)["'],/g.exec(response.data);
      var plugin_name_temp = response.data.match(/pattern: ["'](.*?)["'],/g)
        ? response.data
            .match(/pattern: ["'](.*?)["'],/g)
            .map((e:string) => e.replace("pattern", "").replace(/[^a-zA-Z]/g, ""))
        : "temp";
        if(!plugin_name) return message.send("_Invalid plugin. No plugin name found!_")
        const pluginName = plugin_name[1].split(" ")[0];
      fs.writeFileSync("./plugins/" + pluginName + ".js", response.data);
      plugin_name_temp =
        plugin_name_temp.length > 1 ? plugin_name_temp.join(", ") : pluginName;
      try {
        require("./" + plugin_name);
      } catch (e) {
        fs.unlinkSync(__dirname + "/" + pluginName + ".js");
        return await message.send("invalid plugin\n" + e);
      }
      await message.send(plugin_name_temp + " installed.");
      await ExternalPluginDb.create({
        url: url,
        name: pluginName,
      });
    }
  }
);

Module(
  {
    pattern: "plugin ?(.*)",
    fromMe: true,
    use: "owner",
    desc: "plugin list",
  },
  async (message:Message, match:RegExpMatchArray) => {
    await ExternalPluginDb?.sync();
    
    var plugins = await ExternalPluginDb?.findAll();
    if (match[1] !== "") {
      var plugin = plugins.filter(
        (_plugin) => _plugin.dataValues.name === match[1]
      );
      try {
        await message.send(
          `_${plugin[0].dataValues.name}:_ ${plugin[0].dataValues.url}`
        );
      } catch {
        return await message.send("plugin not found");
      }
      return;
    }
    var msg = "\n";
    var plugins = await ExternalPluginDb?.findAll();
    
    if (plugins.length < 1) {
      return await message.send("plugin not found");
    } else {
      plugins.map((plugin) => {
        msg +=
          "**" +
          plugin.dataValues.name +
          "** : " +
          (plugin.dataValues.url.endsWith("/raw")
            ? plugin.dataValues.url.replace("raw", "")
            : plugin.dataValues.url) +
          "\n\n";
      });
      return await message.send(msg);
    }
  }
);

Module(
  {
    pattern: "remove ?(.*)",
    fromMe: true,
    use: "owner",
    desc: "plugin remover",
  },
  async (message:Message, match:RegExpMatchArray) => {
    if (match[1] === "") return await message.send("need plugin");
    await ExternalPluginDb.sync();
    var plugin = await ExternalPluginDb.findAll({
      where: {
        name: match[1],
      },
    });
    if (plugin.length < 1) {
      return await message.send("plugin not found");
    } else {
      await plugin[0].destroy();
      const Message = match[1] + " removed succesfully";
      await message.send(Message);
      delete require.cache[require.resolve("./" + match[1] + ".js")];
      fs.unlinkSync("./plugins/" + match[1] + ".js");
    }
  }
);
