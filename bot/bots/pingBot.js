const { botHandler } = require("../handler");
const { apiId, apiHash, BOT_TOKEN } = require("../../config");
const { startCommand, pingCommand } = require("../utils/defaultCommands");

botHandler({
  name: "pingBot",
  apiId,
  apiHash,
  BOT_TOKEN,
  commands: [
    pingCommand,
    startCommand,
  ],
});
