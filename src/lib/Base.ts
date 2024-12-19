import { Api } from "telegram";
import { CreateClient } from "./createClient";
import { EntityLike } from "telegram/define";
import { SendMessageParams } from "telegram/client/messages";



export default class Base {
  id:undefined|number
  jid!:Api.TypePeer
  userId!:Api.TypePeer
  message!:string
  timestamp!:number
  data!:Api.Message
  quoted:number | undefined
  mentioned:boolean | undefined
  client!:CreateClient
  constructor(client:CreateClient,data:Api.Message) {
    Object.defineProperty(this, "client", { value: client });
    this._patch(data,client)
  }
  _patch(data:Api.Message, client:CreateClient) {
    this.id = data.id === undefined ? undefined : data.id;
    this.jid = data.peerId 
    this.userId = data.fromId ? data.fromId : this.jid;

    this.message = data.message;

    this.timestamp = data.date;

    this.data = data;

    if (data.replyTo) {
      this.quoted = data.replyTo.replyToMsgId;
    } else {
      this.quoted = undefined;
    }

    this.mentioned = data.mentioned;
}

  _clone() {
    return Object.assign(Object.create(this), this);
  }
  async getUsername(id:EntityLike):Promise<string | undefined>{
    try {
      let result = await this.client.getEntity(id)      
      if ("username" in result) {
        return result.username; 
      }
      return undefined; 
    } catch (e) {
      throw e;
    }
  };
  async forwardMessage(to:EntityLike){
    return await this.data.forwardTo(to)
  };
  async changeGroupTitle(username:Api.TypeEntityLike, text:string){
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
  async send(text:string,options = {}) {
    let a = await this.client.sendMessage(this.jid, {
      message: text,
      ...options
    });
    return a 
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
  async delete(params = {revoke:true}){
    return await this.data.delete(params);
  }
  async reply(params:SendMessageParams){
    return await this.data.reply(params);
  }
  get jidValue():Api.long | undefined{
    const tojson = this.jid.toJSON()
    if ("channelId" in tojson) {
      return tojson.channelId
    } else if ("chatId" in tojson) {
      return tojson.chatId
    } else if ("userId" in tojson) {
      return tojson.userId
    }
    return undefined
  }
}


module.exports = Base;
