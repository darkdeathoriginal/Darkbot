import { buildReplyMarkup } from "telegram/client/buttons";
import { ButtonLike } from "telegram/define";

const { Button } = require("telegram/tl/custom/button");
const { compressText } = require("../../lib/helpers");
export default class ButtonBuilder{
    private button!:ButtonLike[]
    constructor(){
        this.button = []
    }
    add(array:ButtonLike){
        this.button.push(array)
    }
    build(){
        return buildReplyMarkup(this.button)
    }
    inline(title:string,data:string){
        return Button.inline(title,compressText(data))
    }

}
exports.ButtonBuilder = ButtonBuilder