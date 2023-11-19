"use strict";

const { Api } = require("telegram");

class Base {
  constructor(client) {
    Object.defineProperty(this, "client", { value: client });
  }

  _clone() {
    return Object.assign(Object.create(this), this);
  }

  _patch(data) {
    return data;
  }
  async edit(text, id = this.id){
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
  async getUsername(id = this.jid){
    try {
      return (await this.client.getEntity(id)).username;
    } catch (e) {
      throw e;
    }
  };
  async updatGroupImage(id){
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
  async forwardMessage(from, id, to,options = {}){
    await this.client.invoke(
      new Api.messages.ForwardMessages({
        ...options,
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
  async changeGroupTitle(username, text){
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
  async getQuoted(){
    return new Message(this.client, (await this.client.getMessages(this.jid, { ids: this.quoted }))[0]);
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


module.exports = Base;
