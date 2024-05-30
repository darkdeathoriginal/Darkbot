const { Module } = require("../index");
const fs = require("fs");
const ytdl = require("ytdl-core");
const { avMix } = require("../lib/ffmpegHelpers");
const { CreateClient } = require("../lib/createClient");

Module(
  {
    pattern: "ytdl ?(.*)",
    fromMe: true,
    desc: "Download YouTube video",
    use: "utility",
  },
  async (m, match) => {
    let url = match[1];
    let info = await ytdl.getInfo(url);
    let data = {};
    let text = "**Available Quality**\n\n";
    let n = 1;
    for (let i of info.formats.filter(e=>e.qualityLabel&&e.contentLength).sort((a,b)=> a.qualityLabel.split("p")[0] - b.qualityLabel.split("p")[0])){
        data[n] = { url, itag: i.itag, audio: i.hasAudio };
        text += `${n}, **${i.qualityLabel}** (${(
          parseInt(i.contentLength) / 1000000
        ).toFixed(2)}mb)\n`;
        n++;
    }

    text += "\nReply with the number to download.";
    this.ytdl = this.ytdl || {};
    this.ytdl[m.jid] = { data };

    let a = await m.send(text);
    this.ytdl[m.jid].id = a.id;
  }
);

Module(
  {
    on: "message",
    fromMe: true,
  },
  async (m, match) => {
    const quoted = await m.getQuoted();
    if (!quoted || !this.ytdl || this.ytdl[m.jid]?.id != quoted.id) return;

    let no = /\d+/.test(m.message) ? m.message.match(/\d+/)[0] : null;
    if (!no) throw "_Reply must be a number_";

    let data = this.ytdl[m.jid].data[no];
    let url = data.url;
    let info = await ytdl.getInfo(url);

    const tempVideoPath = "./temp/test.mp4";
    const tempAudioPath = "./temp/test.mp3";

    m.send("Uploading video...");
    const downloadVideo = () =>
      new Promise((resolve, reject) => {
        ytdl(url, { quality: data.itag })
          .pipe(fs.createWriteStream(tempVideoPath))
          .on("finish", resolve)
          .on("error", reject);
      });

    const downloadAudio = () =>
      new Promise((resolve, reject) => {
        ytdl(url, { quality: "140" })
          .pipe(fs.createWriteStream(tempAudioPath))
          .on("finish", resolve)
          .on("error", reject);
      });

    try {
    if(data.audio){
        await downloadVideo()
        return await m.client.send(m.jid, {video:{url:tempVideoPath}, fileName: info.videoDetails.title + ".mp3"})
    }
      await Promise.all([downloadVideo(), downloadAudio()]);

      let video = await avMix(tempVideoPath, tempAudioPath);
      const videosize = video.byteLength;

      if (videosize > 100000000) {
        await m.client.sendMessage(m.jid, {
          document: video,
          mimetype: "video/mp4",
          fileName: info.videoDetails.title + ".mp4",
        });
      } else {
        await m.client.send(m.jid, {
          video: video,
          fileName: info.videoDetails.title + ".mp4",
        });
      }
    } catch (error) {
      console.error("Error downloading or mixing video:", error);
      await m.send("An error occurred while processing the video.");
    } finally {
      fs.unlink(tempVideoPath, () => {});
      fs.unlink(tempAudioPath, () => {});
    }
  }
);
