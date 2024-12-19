import { Api } from "telegram";
import { CreateClient } from "./createClient";
import Base from "./Base";

const fs = require("fs");
export default class Message extends Base {
  constructor(client:CreateClient, data:Api.Message) {
    super(client,data);
  }

  async getQuoted() {
    const message = await this.data.getReplyMessage()
    if(message == undefined) return undefined
    return new Message(this.client,message);
  }
  async download(){
    const buffer = await this.client.downloadMedia(this.data, {})
    return buffer
  }
}

module.exports = Message;
