const Base = require("./Base");
const fs = require("fs");
class Message extends Base {
  constructor(client, data) {
    super(client);
    if (data) this._patch(data, client);
  }

  _patch(data, client) {
    this.id = data.id === undefined ? undefined : data.id;
    this.jid = Number(
      data.peerId.userId
        ? data.peerId.userId.value
        : data.peerId.channelId.value
    );
    this.userId = data.fromId ? data.fromId.userId : this.jid;

    this.message = data.message;

    this.timestamp = data.date;

    this.data = data;

    if (data.replyTo) {
      this.quoted = data.replyTo.replyToMsgId;
    } else {
      this.quoted = false;
    }

    this.mentioned = data.mentioned;

    return super._patch(data);
  }
  async getQuoted() {
    return new Message(this.client,await this.data.getReplyMessage());
  }
  async send(text) {
    let a = await this.client.send(this.jid, {
      text: text,
    });
    return new Message(this.client, a);
  }
  async edit(options) {
    if (!options) throw new Error("options is required");
    try {
      return await this.client.editMessage(this.jid, {
        message: this.id,
        ...options,
      });
    } catch (error) {
      throw new Error(error);
    }
  }
  async download(){
    const buffer = await this.client.downloadMedia(this.data, {})
    return buffer
  }
}

module.exports = Message;
