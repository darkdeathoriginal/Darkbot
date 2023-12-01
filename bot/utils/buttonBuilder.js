const {buildReplyMarkup} = require("telegram/client/buttons");
const { Button } = require("telegram/tl/custom/button");
class ButtonBuilder{
    constructor(){
        this.button = []
    }
    add(array){
        this.button.push(array)
    }
    build(){
        return buildReplyMarkup(this.button)
    }
    inline(title,data){
        return Button.inline(title,Buffer.from(data))
    }

}
exports.ButtonBuilder = ButtonBuilder