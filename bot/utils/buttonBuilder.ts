const { buildReplyMarkup } = require("telegram/client/buttons");
const { Button } = require("telegram/tl/custom/button");
const { compressText } = require("../../lib/helpers");
class ButtonBuilder {
  button: any[];
  constructor() {
    this.button = [];
  }
  add(array) {
    this.button.push(array);
  }
  build() {
    return buildReplyMarkup(this.button);
  }
  inline(title, data) {
    return Button.inline(title, compressText(data));
  }
}
exports.ButtonBuilder = ButtonBuilder;
