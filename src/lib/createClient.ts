import EventEmitter from "events";
import { Api, Logger, TelegramClient } from "telegram";
import { TelegramClientParams } from "telegram/client/telegramBaseClient";
import { CustomFile } from "telegram/client/uploads";
import { EntityLike } from "telegram/define";
import { NewMessage } from "telegram/events";
import { LogLevel } from "telegram/extensions/Logger";
import { StringSession } from "telegram/sessions";
import fs from "fs"
import Message from "./Message";


interface SendObjectBase {
  fileName?: string; // Optional common property
}

interface TextSendObject extends SendObjectBase {
  text: string; // Required for text
  image?: never;
  video?: never;
  document?: never;
}

interface ImageSendObject extends SendObjectBase {
  image: Buffer | { url: string }; // Required for image
  text?: never;
  video?: never;
  document?: never;
}

interface VideoSendObject extends SendObjectBase {
  video: Buffer | { url: string }; // Required for video
  text?: never;
  image?: never;
  document?: never;
}

interface DocumentSendObject extends SendObjectBase {
  document: Buffer | { url: string }; // Required for document
  text?: never;
  image?: never;
  video?: never;
}

type SendObject = TextSendObject | ImageSendObject | VideoSendObject | DocumentSendObject;


async function createUrlFile(path:string, type = "image") {
  const result = new CustomFile(
    type == "image" ? "test.png" : "test.mp4",
    fs.statSync(path).size,
    path
  );
  return result;
}
async function createBufferFile(buffer:Buffer, type = "image") {
  const result = new CustomFile(
    type == "image" ? "test.png" : "test.mp4",
    buffer.length,
    "",
    buffer
  );
  return result;
}
export class CreateClient extends TelegramClient {
  event:EventEmitter
  constructor(stringSession:StringSession, apiId:number, apiHash:string, options:TelegramClientParams) {
    super(stringSession, apiId, apiHash, {
      ...options,
      connectionRetries: 5,
      baseLogger: new Logger(LogLevel.ERROR),
    });
    this.event = new EventEmitter();
    this.addEventHandler((event) => {
      let message = new Message(this, event.message);
      const type = message.quoted
        ? `${message.jid}-quoted-${message.quoted}`
        : `${message.jid}-message`;
      this.event.emit(type, message);
    }, new NewMessage({}));
  }
  async getReplyMessage(jid:string, quoted = false) {
    const type = quoted ? `${jid}-quoted-${quoted}` : `${jid}-message`;
    return new Promise((resolve, reject) => {
      this.event.once(type, (message) => {
        resolve(message);
      });
    });
  }
  async send(id:EntityLike, obj:SendObject, options = {}) {
    try {
      if (obj.text) {
        return await this.sendMessage(id, {
          message: obj.text,
        });
      } else if (obj.image) {
        if (obj.image instanceof Buffer) {
          await this.sendFile(id, { file: await createBufferFile(obj.image) });
        } else if ("url" in obj.image) {
          await this.sendFile(id, { file: await createUrlFile(obj.image.url) });
        } else {
          throw new Error("Invalid image type");
        }
      }
       else if (obj.video) {
        if ("url" in obj.video) {
          return await this.sendFile(id, {
            file: await createUrlFile(obj.video.url, "video"),
          });
        } else {
          return await this.sendFile(id, {
            file: await createBufferFile(obj.video, "video"),
          });
        }
      } else if (obj.document) {
        if ("url" in obj.document && obj.fileName) {
          const result = new CustomFile(
            obj.fileName,
            fs.statSync(obj.document.url).size,
            obj.document.url
          );
          return await this.sendFile(id, {
            file: result,
            forceDocument: true,
            workers: 10,
            ...options,
          });
        } else {
          if(!obj.fileName || "url" in obj.document) return
          const result = new CustomFile(
            obj.fileName,
            obj.document.length,
            "",
            obj.document
          );
          return await this.sendFile(id, {
            file: result,
            forceDocument: true,
            workers: 10,
            ...options,
          });
        }
      } else {
        console.log("invalid format");
      }
    } catch (e) {
      throw e;
    }
  }
  async getUserProfilePhotos(userId:Api.TypeEntityLike) {
    return (
      await this.invoke(
        new Api.photos.GetUserPhotos({
          userId: userId,
          offset: 0,
        })
      )
    ).photos;
  }
  async uploadDocumentAction(jid:Api.TypeEntityLike) {
    return await this.invoke(
      new Api.messages.SetTyping({
        peer: jid,
        action: new Api.SendMessageUploadDocumentAction({
          progress:0
        }),
      })
    );
  }
  async cancelAction(jid:Api.TypeEntityLike) {
    return await this.invoke(
      new Api.messages.SetTyping({
        peer: jid,
        action: new Api.SendMessageCancelAction(),
      })
    );
  }
}
export async function createBot(
  apiId:number,
  apiHash:string,
  botToken:string,
  stringSession:StringSession,
  options = {}
) {
  let client = new CreateClient(stringSession, apiId, apiHash, options);
  await client.start({
    botAuthToken: botToken,
  });
  return client;
}
exports.createBot = createBot;
exports.CreateClient = CreateClient;
