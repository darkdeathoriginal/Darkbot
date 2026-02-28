const { Api } = require("telegram");
const Base = require("../../lib/Base");
const { decompressText } = require("../../lib/helpers");

class Callback extends Base {
  constructor(client, data) {
    super(client);
    if (data) this._patch(data, client);
  }
  _patch(data, client) {
    this.id = data.msgId?.id || data.msgId;
    this.jid = data.peer?.userId || data.userId;
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
