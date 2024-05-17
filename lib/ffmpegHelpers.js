const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const avMix = (videoPath, audioPath) => {
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
          if (err) return reject(err);
          resolve(data);
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};


module.exports = {avMix}