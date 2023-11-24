const Base = require("./Base");
class Message extends Base {
  constructor(client,data) {
    super(client);
    if(data) this._patch(data, client);
  }

  _patch(data, client) {
    this.id = data.id === undefined ? undefined : data.id;
    this.jid = Number(
      data.peerId.userId
        ? data.peerId.userId.value
        : data.peerId.channelId.value
    );
    this.userId = data.fromId?data.fromId.userId:this.jid

    this.message = data.message;

    this.timestamp = data.date;

    this.data = data;

    if (data.replyTo) {
      this.quoted = data.replyTo.replyToMsgId
    } else {
      this.quoted = false;
    }

    this.mentioned = data.mentioned

    return super._patch(data);
  }
  async getQuoted(){
    return new Message(this.client, (await this.client.getMessages(this.jid, { ids: this.quoted }))[0]);
  }
  async send(text) {
    let a = await this.client.send(this.jid, {
      text: text,
    });
    return new Message(this.client, a);
  }
}

module.exports = Message;
