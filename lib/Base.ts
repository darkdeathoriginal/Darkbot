"use strict";

const { Api } = require("telegram");
const Message = require("./Message");

class Base {
  client: any;
  data: any;
  jid: any;
  id: any;
  constructor(client: any) {
    Object.defineProperty(this, "client", { value: client });
  }

  _clone() {
    return Object.assign(Object.create(this), this);
  }

  _patch(data) {
    return data;
  }
  async edit(params) {
    return await this.data.edit(params);
  }
  async getUsername(id = this.jid) {
    try {
      return (await this.client.getEntity(id)).username;
    } catch (e) {
      throw e;
    }
  }
  async updatGroupImage(id) {
    try {
      const r1 = await this.client.getMessages(this.jid, {
        ids: id,
      });
      let a = await this.client.getEntity(this.jid);
      if (r1[0]?.media?.photo) {
        await this.client.invoke(
          new Api.channels.EditPhoto({
            channel: await this.getUsername(),
            photo: r1[0].media.photo,
          }),
        );
      }
    } catch (e) {
      throw e;
    }
  }
  async forwardMessage(to) {
    return await this.data.forwardTo(to);
  }
  async changeGroupTitle(username, text) {
    try {
      await this.client.invoke(
        new Api.channels.EditTitle({
          channel: username,
          title: text,
        }),
      );
    } catch (e) {
      console.log(e);
    }
  }
  async send(text, options = {}) {
    let a = await this.client.sendMessage(this.jid, {
      message: text,
      ...options,
    });
    return a;
  }
  async react(emoji = "👍", id = this.id) {
    return await this.client.invoke(
      new Api.messages.SendReaction({
        peer: this.jid,
        msgId: id,
        reaction: [new Api.ReactionEmoji({ emoticon: emoji })],
      }),
    );
  }
  async delete(params = { revoke: true }) {
    return await this.data.delete(params);
  }
  async reply(params) {
    return await this.data.reply(params);
  }
}

module.exports = Base;
