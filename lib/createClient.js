const { TelegramClient, Api, Logger } = require("telegram");
const { CustomFile } = require("telegram/client/uploads");
const { LogLevel } = require("telegram/extensions/Logger");
const fs = require("fs");

function createClient(stringSession, apiId, apiHash, options) {
  let client = new TelegramClient(stringSession, apiId, apiHash, {
    ...options,
    connectionRetries: 5,
    baseLogger: new Logger(LogLevel.ERROR),
  });

  client.send = async (id, obj) => {
    try {
      if (obj.text) {
        return await client.sendMessage(id, {
          message: obj.text,
        });
      } else if (obj.image) {
        if (obj.image.url) {
          const result = new CustomFile(
            "test.png",
            fs.statSync(obj.image.url).size,
            obj.image.url
          );
          await client.sendFile(id, { file: result });
        } else {
          const result = new CustomFile(
            "test.png",
            obj.image.length,
            "",
            obj.image
          );
          await client.sendFile(id, { file: result });
        }
      } else if (obj.video) {
        if (obj.video.url) {
          const result = new CustomFile(
            "test.mp4",
            fs.statSync(obj.video.url).size,
            obj.video.url
          );
          await client.sendFile(id, { file: result });
        } else {
          const result = new CustomFile(
            "test.mp4",
            obj.video.length,
            "",
            obj.video
          );
          await client.sendFile(id, { file: result });
        }
      } else if (obj.document) {
        if (obj.document.url) {
          const result = new CustomFile(
            obj.fileName,
            fs.statSync(obj.document.url).size,
            obj.document.url
          );
          await client.sendFile(id, { file: result, forceDocument: true });
        } else {
          const result = new CustomFile(
            obj.fileName,
            obj.document.length,
            "",
            obj.document
          );
          await client.sendFile(id, { file: result, forceDocument: true });
        }
      } else {
        console.log("invalid format");
      }
    } catch (e) {
      throw e;
    }
  };

  client.getUserProfilePhotos = async (userId) => {
    return (
      await client.invoke(
        new Api.photos.GetUserPhotos({
          userId: userId,
          offset: 0,
        })
      )
    ).photos;
  };
  return client;
}
async function createBot(
  apiId,
  apiHash,
  botToken,
  stringSession,
  options = {}
) {
  let client = await createClient(stringSession, apiId, apiHash, options)
  await client.start({
    botAuthToken: botToken,
  });
  // await client.start(botAuthToken=botToken);
  return client;
}
exports.createBot = createBot;
exports.createClient = createClient;
