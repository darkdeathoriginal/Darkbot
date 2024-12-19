import { Module } from "..";


Module(
  {
    pattern: "gname ?(.*)",
    fromMe: true,
    desc: "change group title",
    use: "utility",
  },
  async (m, match) => {
    let username = await m.getUsername(m.jid);
    if(!username) return await m.reply({
      message:"Username not found"
    })
    await m.changeGroupTitle(username, match[1]);
  }
);
