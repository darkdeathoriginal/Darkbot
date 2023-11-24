const { TelegramClient, Api, Logger } = require("telegram");
const { CustomFile } = require("telegram/client/uploads");
const { LogLevel } = require("telegram/extensions/Logger");
const fs = require("fs");

async function createUrlFile(path,type="image"){
  const result = new CustomFile(
    (type=="image"?"test.png":"test.mp4"),
    fs.statSync(path).size,
    path
  );
  return result;
}
async function createBufferFile(buffer,type="image"){
  const result = new CustomFile(
    (type=="image"?"test.png":"test.mp4"),
    buffer.length,
    "",
    buffer
  );
  return result;
}
class CreateClient extends TelegramClient {
  constructor(stringSession, apiId, apiHash, options) {
    super(stringSession, apiId, apiHash, {
      ...options,
      connectionRetries: 5,
      baseLogger: new Logger(LogLevel.ERROR),
    });
  }
  async send(id, obj) {
    try {
      if (obj.text) {
        return await this.sendMessage(id, {
          message: obj.text,
        });
      } else if (obj.image) {
        if (obj.image.url) {
          await this.sendFile(id, { file: await createUrlFile(obj.image.url) });
        } else {
          await this.sendFile(id, { file: await createBufferFile(obj.image) });
        }
      } else if (obj.video) {
        if (obj.video.url) {
          await this.sendFile(id, { file: await createUrlFile(obj.video.url,"video") });
        } else {

          await this.sendFile(id, { file: await createBufferFile(obj.video,"video") });
        }
      } else if (obj.document) {
        if (obj.document.url) {
          const result = new CustomFile(
            obj.fileName,
            fs.statSync(obj.document.url).size,
            obj.document.url
          );
          await this.sendFile(id, { file: result, forceDocument: true });
        } else {
          const result = new CustomFile(
            obj.fileName,
            obj.document.length,
            "",
            obj.document
          );
          await this.sendFile(id, { file: result, forceDocument: true });
        }
      } else {
        console.log("invalid format");
      }
    } catch (e) {
      throw e;
    }
  }
  async getUserProfilePhotos(userId) {
    return (
      await this.invoke(
        new Api.photos.GetUserPhotos({
          userId: userId,
          offset: 0,
        })
      )
    ).photos;
  }
}
async function createBot(
  apiId,
  apiHash,
  botToken,
  stringSession,
  options = {}
) {
  let client = new CreateClient(stringSession, apiId, apiHash, options)
  await client.start({
    botAuthToken: botToken,
  });
  return client;
}
exports.createBot = createBot;
exports.CreateClient = CreateClient;
