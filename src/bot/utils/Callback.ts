import { CreateClient } from "src/lib/createClient";
import { CallbackQueryEvent } from "telegram/events/CallbackQuery";

const { Api } = require("telegram");
const Base = require("../../lib/Base");
const { decompressText } = require("../../lib/helpers");

export default class Callback extends Base {
  constructor(client:CreateClient, data:CallbackQueryEvent["query"]) {
    super(client);
    if (data) this._patch(data, client);
  }
  _patch(data:CallbackQueryEvent["query"], client:CreateClient) {
    this.id = data.msgId;
    this.jid = data.userId;
    this.queryId = data.queryId;
    this.query = decompressText(data.data);
    this.data = data;
  }
  async answer(options = {}) {
    return await this.client.invoke(
      new Api.messages.SetBotCallbackAnswer({
        queryId: this.queryId,
        cacheTime: 43,
        ...options,
      })
    );
  }
}
exports.Callback = Callback;
