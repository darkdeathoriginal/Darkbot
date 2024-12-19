type CharMap = Record<string, string>;

export function FancyRandom(text:string):string {
    function main(data:CharMap, t1:string) {
      let final = "";
      for (let i of t1.split("")) {
        if (data[i] !== undefined) final += data[i];
        else {
           final += i;
        }
      }
      return final;
    }
    const s1 = {a: "𝔞",b: "𝔟",c: "𝔠",d: "𝔡",e: "𝔢",f: "𝔣",g: "𝔤",h: "𝔥",i: "𝔦",j: "𝔧",k: "𝔨",l: "𝔩",m: "𝔪",n: "𝔫",o: "𝔬",p: "𝔭",q: "𝔮",r: "𝔯",s: "𝔰",t: "𝔱",u: "𝔲",v: "𝔳",w: "𝔴",x: "𝔵",y: "𝔶",z: "𝔷",A: "𝔄",B: "𝔅",C: "ℭ",D: "𝔇",E: "𝔈",F: "𝔉",G: "𝔊",H: "ℌ",I: "ℑ",J: "𝔍",K: "𝔎",L: "𝔏",M: "𝔐",N: "𝔑",O: "𝔒",P: "𝔓",Q: "𝔔",R: "ℜ",S: "𝔖",T: "𝔗",U: "𝔘",V: "𝔙",W: "𝔚",X: "𝔛",Y: "𝔜",Z: "ℨ",},
          s2 = {0: "𝟶",1: "𝟷",2: "𝟸",3: "𝟹",4: "𝟺",5: "𝟻",6: "𝟼",7: "𝟽",8: "𝟾",9: "𝟿",a: "𝚊",b: "𝚋",c: "𝚌",d: "𝚍",e: "𝚎",f: "𝚏",g: "𝚐",h: "𝚑",i: "𝚒",j: "𝚓",k: "𝚔",l: "𝚕",m: "𝚖",n: "𝚗",o: "𝚘",p: "𝚙",q: "𝚚",r: "𝚛",s: "𝚜",t: "𝚝",u: "𝚞",v: "𝚟",w: "𝚠",x: "𝚡",y: "𝚢",z: "𝚣",A: "𝙰",B: "𝙱",C: "𝙲",D: "𝙳",E: "𝙴",F: "𝙵",G: "𝙶",H: "𝙷",I: "𝙸",J: "𝙹",K: "𝙺",L: "𝙻",M: "𝙼",N: "𝙽",O: "𝙾",P: "𝙿",Q: "𝚀",R: "𝚁",S: "𝚂",T: "𝚃",U: "𝚄",V: "𝚅",W: "𝚆",X: "𝚇",Y: "𝚈",Z: "𝚉",},
          s3 = {0: "0",1: "1",2: "2",3: "3",4: "4",5: "5",6: "6",7: "7",8: "8",9: "9",a: "𝙖",b: "𝙗",c: "𝙘",d: "𝙙",e: "𝙚",f: "𝙛",g: "𝙜",h: "𝙝",i: "𝙞",j: "𝙟",k: "𝙠",l: "𝙡",m: "𝙢",n: "𝙣",o: "𝙤",p: "𝙥",q: "𝙦",r: "𝙧",s: "𝙨",t: "𝙩",u: "𝙪",v: "𝙫",w: "𝙬",x: "𝙭",y: "𝙮",z: "𝙯",A: "𝘼",B: "𝘽",C: "𝘾",D: "𝘿",E: "𝙀",F: "𝙁",G: "𝙂",H: "𝙃",I: "𝙄",J: "𝙅",K: "𝙆",L: "𝙇",M: "𝙈",N: "𝙉",O: "𝙊",P: "𝙋",Q: "𝙌",R: "𝙍",S: "𝙎",T: "𝙏",U: "𝙐",V: "𝙑",W: "𝙒",X: "𝙓",Y: "𝙔",Z: "𝙕",},
          s4 = {0: "𝟎",1: "𝟏",2: "𝟐",3: "𝟑",4: "𝟒",5: "𝟓",6: "𝟔",7: "𝟕",8: "𝟖",9: "𝟗",a: "𝐚",b: "𝐛",c: "𝐜",d: "𝐝",e: "𝐞",f: "𝐟",g: "𝐠",h: "𝐡",i: "𝐢",j: "𝐣",k: "𝐤",l: "𝐥",m: "𝐦",n: "𝐧",o: "𝐨",p: "𝐩",q: "𝐪",r: "𝐫",s: "𝐬",t: "𝐭",u: "𝐮",v: "𝐯",w: "𝐰",x: "𝐱",y: "𝐲",z: "𝐳",A: "𝐀",B: "𝐁",C: "𝐂",D: "𝐃",E: "𝐄",F: "𝐅",G: "𝐆",H: "𝐇",I: "𝐈",J: "𝐉",K: "𝐊",L: "𝐋",M: "𝐌",N: "𝐍",O: "𝐎",P: "𝐏",Q: "𝐐",R: "𝐑",S: "𝐒",T: "𝐓",U: "𝐔",V: "𝐕",W: "𝐖",X: "𝐗",Y: "𝐘",Z: "𝐙",},
          s5 = {0: "𝟬",1: "𝟭",2: "𝟮",3: "𝟯",4: "𝟰",5: "𝟱",6: "𝟲",7: "𝟳",8: "𝟴",9: "𝟵",a: "𝗮",b: "𝗯",c: "𝗰",d: "𝗱",e: "𝗲",f: "𝗳",g: "𝗴",h: "𝗵",i: "𝗶",j: "𝗷",k: "𝗸",l: "𝗹",m: "𝗺",n: "𝗻",o: "𝗼",p: "𝗽",q: "𝗾",r: "𝗿",s: "𝘀",t: "𝘁",u: "𝘂",v: "𝘃",w: "𝘄",x: "𝘅",y: "𝘆",z: "𝘇",A: "𝗔",B: "𝗕",C: "𝗖",D: "𝗗",E: "𝗘",F: "𝗙",G: "𝗚",H: "𝗛",I: "𝗜",J: "𝗝",K: "𝗞",L: "𝗟",M: "𝗠",N: "𝗡",O: "𝗢",P: "𝗣",Q: "𝗤",R: "𝗥",S: "𝗦",T: "𝗧",U: "𝗨",V: "𝗩",W: "𝗪",X: "𝗫",Y: "𝗬",Z: "𝗭",},
          s6 = {0: "𝟘",1: "𝟙",2: "𝟚",3: "𝟛",4: "𝟜",5: "𝟝",6: "𝟞",7: "𝟟",8: "𝟠",9: "𝟡",a: "𝕒",b: "𝕓",c: "𝕔",d: "𝕕",e: "𝕖",f: "𝕗",g: "𝕘",h: "𝕙",i: "𝕚",j: "𝕛",k: "𝕜",l: "𝕝",m: "𝕞",n: "𝕟",o: "𝕠",p: "𝕡",q: "𝕢",r: "𝕣",s: "𝕤",t: "𝕥",u: "𝕦",v: "𝕧",w: "𝕨",x: "𝕩",y: "𝕪",z: "𝕫",A: "𝔸",B: "𝔹",C: "ℂ",D: "𝔻",E: "𝔼",F: "𝔽",G: "𝔾",H: "ℍ",I: "𝕀",J: "𝕁",K: "𝕂",L: "𝕃",M: "𝕄",N: "ℕ",O: "𝕆",P: "ℙ",Q: "ℚ",R: "ℝ",S: "𝕊",T: "𝕋",U: "𝕌",V: "𝕍",W: "𝕎",X: "𝕏",Y: "𝕐",Z: "ℤ",},
          s7 = {0: "0",1: "1",2: "2",3: "3",4: "4",5: "5",6: "6",7: "7",8: "8",9: "9",a: "𝘢",b: "𝘣",c: "𝘤",d: "𝘥",e: "𝘦",f: "𝘧",g: "𝘨",h: "𝘩",i: "𝘪",j: "𝘫",k: "𝘬",l: "𝘭",m: "𝘮",n: "𝘯",o: "𝘰",p: "𝘱",q: "𝘲",r: "𝘳",s: "𝘴",t: "𝘵",u: "𝘶",v: "𝘷",w: "𝘸",x: "𝘹",y: "𝘺",z: "𝘻",A: "𝘈",B: "𝘉",C: "𝘊",D: "𝘋",E: "𝘌",F: "𝘍",G: "𝘎",H: "𝘏",I: "𝘐",J: "𝘑",K: "𝘒",L: "𝘓",M: "𝘔",N: "𝘕",O: "𝘖",P: "𝘗",Q: "𝘘",R: "𝘙",S: "𝘚",T: "𝘛",U: "𝘜",V: "𝘝",W: "𝘞",X: "𝘟",Y: "𝘠",Z: "𝘡",},
          s8 = {a: "ᴀ",b: "ʙ",c: "ᴄ",d: "ᴅ",e: "ᴇ",f: "ғ",g: "ɢ",h: "ʜ",i: "ɪ",j: "ᴊ",k: "ᴋ",l: "ʟ",m: "ᴍ",n: "ɴ",o: "ᴏ",p: "ᴘ",q: "ǫ",r: "ʀ",s: "s",t: "ᴛ",u: "ᴜ",v: "ᴠ",w: "ᴡ",x: "x",y: "ʏ",z: "ᴢ",A: "ᴀ",B: "ʙ",C: "ᴄ",D: "ᴅ",E: "ᴇ",F: "ғ",G: "ɢ",H: "ʜ",I: "ɪ",J: "ᴊ",K: "ᴋ",L: "ʟ",M: "ᴍ",N: "ɴ",O: "ᴏ",P: "ᴘ",Q: "ǫ",R: "ʀ",S: "s",T: "ᴛ",U: "ᴜ",V: "ᴠ",W: "ᴡ",X: "x",Y: "ʏ",Z: "ᴢ",};
    var data = [s1, s2, s4, s3, s5, s6, s7, s8],
      ndata = data[Math.floor(Math.random() * data.length)],
      res = main(ndata, text);
    return res;
}
module.exports = {FancyRandom}
  