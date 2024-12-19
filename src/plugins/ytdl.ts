import fs from "fs";
import ytdl from "@distube/ytdl-core";
import { avMix } from "../lib/ffmpegHelpers";
import { Module } from "..";

const ytdlData: Record<string, { id: number; data: Record<string, { url: string; itag: number; audio: boolean }> }> = {};

Module(
  {
    pattern: "ytdl ?(.*)",
    fromMe: true,
    desc: "Download YouTube video",
    use: "utility",
  },
  async (m, match) => {
    const jid = Number(m.jidValue);
    const url = match[1];
    if (!url) throw "Please provide a YouTube URL.";

    const info = await ytdl.getInfo(url);
    const data: Record<string, { url: string; itag: number; audio: boolean }> = {};
    let text = "**Available Quality**\n\n";
    let n = 1;

    for (const format of info.formats
      .filter((f) => f.qualityLabel && f.contentLength)
      .sort((a, b) => parseInt(a.qualityLabel || "0") - parseInt(b.qualityLabel || "0"))) {
      data[n] = { url, itag: format.itag, audio: format.hasAudio || false };
      text += `${n}. **${format.qualityLabel}** (${(
        parseInt(format.contentLength || "0") / 1000000
      ).toFixed(2)} MB)\n`;
      n++;
    }

    text += "\nReply with the number to download.";

    const message = await m.send(text);
    ytdlData[jid] =  { data ,id:message.id};
  }
);

Module(
  {
    on: "message",
    fromMe: true,
    desc:"",
    use:""
  },
  async (m,a) => {
    const jid = Number(m.jidValue);
    const quoted = await m.getQuoted();

    if (!quoted || !ytdlData[jid] || ytdlData[jid].id !== quoted.id) return;

    const match = m.message.match(/\d+/);
    const no = match ? parseInt(match[0]) : null;
    if (!no || !ytdlData[jid].data[no]) throw "_Reply must be a valid number_";

    const { url, itag, audio } = ytdlData[jid].data[no];
    const info = await ytdl.getInfo(url);

    const tempVideoPath = "./temp/test.mp4";
    const tempAudioPath = "./temp/test.mp3";

    m.send("Uploading video...");

    const downloadVideo = () =>
      new Promise<void>((resolve, reject) => {
        ytdl(url, { quality: itag })
          .pipe(fs.createWriteStream(tempVideoPath))
          .on("finish", resolve)
          .on("error", reject);
      });

    const downloadAudio = () =>
      new Promise<void>((resolve, reject) => {
        ytdl(url, { quality: "140" })
          .pipe(fs.createWriteStream(tempAudioPath))
          .on("finish", resolve)
          .on("error", reject);
      });

    try {
      if (audio) {
        await downloadVideo();
        return await m.client.send(m.jid, {
          video: { url: tempVideoPath },
          fileName: `${info.videoDetails.title}.mp4`,
        });
      }

      await Promise.all([downloadVideo(), downloadAudio()]);
      const video = await avMix(tempVideoPath, tempAudioPath);
      const videoSize = video.byteLength;

      if (videoSize > 100000000) {
        await m.client.send(m.jid, {
          document: video,
          fileName: `${info.videoDetails.title}.mp4`,
        });
      } else {
        await m.client.send(m.jid, {
          video: video,
          fileName: `${info.videoDetails.title}.mp4`,
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
