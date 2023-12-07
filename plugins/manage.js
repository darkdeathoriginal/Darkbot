const config = require("../config");
const fs = require("fs");
const { Module } = require("../index");

Module(
  {
    pattern: "setvar ?(.*)",
    fromMe: true,
    desc: "environment varialble changer",
    use: "utility",
  },
  async (m, match) => {
    console.log(match);
    match = match[1]
    if (!match)
      return await m.send("_Need params!_\n_Eg: .setvar MODE:public_");
    let [key, ...valueArr] = match.split(":");
    let value = valueArr.join(":");
    config[key] = value;
    await setvar(key, value);
    await m.send(`_Successfully set ${key} to ${value}, Rebooting.._`)
    process.exit(1);
  }
);

async function setvar(key, value) {
  try {
    var envFile = fs.readFileSync(`./.env`, "utf-8");
    const lines = envFile.trim().split("\n");
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith(`${key}=`)) {
        lines[i] = `${key}="${value}"`;
        found = true;
        break;
      }
    }
    if (!found) {
      lines.push(`${key}="${value}"`);
    }
    fs.writeFileSync("./.env", lines.join("\n"));
  } catch (error) {
    console.log(error);
  }
}
