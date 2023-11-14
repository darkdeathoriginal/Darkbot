const { Module } = require("../index");

Module(
  {
    pattern: "gpp ?(.*)",
    fromMe: true,
    desc: "changes/gets group image",
    use: "utility",
  },
  async (m, match) => {
    if (m.quoted) {
      const quoted = await m.getQuoted();
      let id = quoted.id;
      const r1 = await m.client.getMessages(m.jid, {
        ids: id,
      });
      if (r1[0]?.media?.photo) {
        await m.updatGroupImage(id);
        return await m.send("Profile picture updated");
      }
    }
    const buffer = await m.client.downloadProfilePhoto(m.jid, { isBig: true });
    await m.client.send(m.jid, { image: buffer });
  }
);
Module(
  {
    pattern: "gname ?(.*)",
    fromMe: true,
    desc: "change group title",
    use: "utility",
  },
  async (m, match) => {
    let username = await m.getUsername();
    await m.changeGroupTitle(username, match[1]);
  }
);
