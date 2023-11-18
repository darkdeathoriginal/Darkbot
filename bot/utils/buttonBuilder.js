const {buildReplyMarkup} = require("telegram/client/buttons");
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

}
exports.ButtonBuilder = ButtonBuilder