"use strict";

const { Api } = require("telegram");
const Message = require("./Message");

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
  async forwardMessage(to,options = {}){
    await this.client.invoke(
      new Api.messages.ForwardMessages({
        ...options,
        withMyScore: true,
        fromPeer: this.jid,
        id: [this.id],
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
    if(!this.quoted) return false;
    return new Message(this.client, (await this.client.getMessages(this.jid, { ids: this.quoted }))[0]);
  }
  async send(text,options = {}) {
    let a = await this.client.sendMessage(this.jid, {
      message: text,
      ...options
    });
    try {
      return new Message(this.client, a); 
    } catch (error) {
      
    }
  }
  async react(emoji="👍",id=this.id){
    return await this.client.invoke(
      new Api.messages.SendReaction({
          peer: this.jid,
          msgId: id,
          reaction: [new Api.ReactionEmoji({emoticon:emoji})],
      })
  )
  }
  async delete(){
    await this.client.deleteMessages(this.jid, [this.id], {revoke:false});
  }
}


module.exports = Base;
