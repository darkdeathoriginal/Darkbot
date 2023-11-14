const { Api } = require("telegram");
const Base = require("./Base");
const ReplyMessage = require("./ReplyMessage");
class Message extends Base {
  constructor(client,data) {
    super(client);
    if(data) this._patch(data, client);
  }

  async _patch(data, client) {
    this.id = data.id === undefined ? undefined : data.id;
    this.jid = Number(
      data.peerId.userId
        ? data.peerId.userId.value
        : data.peerId.channelId.value
    );

    this.message = data.message;

    this.timestamp = data.date;

    this.data = data;

    if (data.replyTo) {
      try {
        this.quoted = new ReplyMessage(
          this.client,
          (
            await client.getMessages(this.jid, { ids: data.replyTo.replyToMsgId })
          )[0]
        ); 
      } catch (error) {
        console.log("error in reply message");
        this.quoted = false;
      }
    } else {
      this.quoted = false;
    }

    if (
      data.message.hasOwnProperty("extendedTextMessage") &&
      data.message.extendedTextMessage.hasOwnProperty("contextInfo") === true &&
      data.message.extendedTextMessage.contextInfo.hasOwnProperty(
        "mentionedJid"
      )
    ) {
      this.mention = data.message.extendedTextMessage.contextInfo.mentionedJid;
    } else {
      this.mention = false;
    }

    return super._patch(data);
  }
  edit = async (text, id = this.id) => {
    await this.client.invoke(
      new Api.messages.EditMessage({
        noWebpage: true,
        peer: this.jid,
        id: id,
        message: text,
      })
    );
    return true;
  };
  getUsername = async (id = this.jid) => {
    try {
      return (await this.client.getEntity(id)).username;
    } catch (e) {
      throw e;
    }
  };
  updatGroupImage = async (id) => {
    try {
      const r1 = await this.client.getMessages(message.jid, {
        ids: id,
      });
      let a = await this.client.getEntity(message.jid);
      if (r1[0]?.media?.photo) {
        await this.client.invoke(
          new Api.channels.EditPhoto({
            channel: await this.getUsername(),
            photo: r1[0].media.photo,
          })
        );
      }
    } catch (e) {
      throw e;
    }
  };
  forwardMessage = async (from, id, to) => {
    await this.client.invoke(
      new Api.messages.ForwardMessages({
        silent: true,
        background: true,
        withMyScore: true,
        fromPeer: from,
        id: [id],
        randomId: [Math.floor(Math.random() * 1000000)],
        toPeer: to,
      })
    );
  };
  changeGroupTitle = async (username, text) => {
    try {
      await this.client.invoke(
        new Api.channels.EditTitle({
          channel: username,
          title: text,
        })
      );
    } catch (e) {
      console.log(e);
    }
  };
  async reply(text) {
    var message = await this.client.sendMessage(
      this.jid,
      text,
      MessageType.text
    );

    return new Message(this.client, message);
  }

  async send(text) {
    let a = await this.client.send(this.jid, {
      text: text,
    });
    return new Message(this.client, a);
  }
  async delete(){
    await this.client.deleteMessages(this.jid, [this.id], {revoke:false});
  }
}

module.exports = Message;
