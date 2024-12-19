import fs from "fs";
import ffmpeg from "fluent-ffmpeg";

export const avMix = (videoPath: string, audioPath: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const output = "./temp/output.mp4";

    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions("-c:v copy")
      .outputOptions("-c:a aac")
      .save(output)
      .on("end", () => {
        fs.readFile(output, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};
