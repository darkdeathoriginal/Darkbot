const { Api } = require("telegram");
const Base = require("../../lib/Base");

class Callback extends Base {
  constructor(client, data) {
    super(client);
    if (data) this._patch(data, client);
  }
  _patch(data, client) {
    this.id = data.msgId;
    this.jid = data.peer.userId;
    this.queryId = data.queryId;
    this.query = data.data.toString();
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
