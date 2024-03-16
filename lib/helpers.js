const PDFDocument = require("pdfkit");
const fs = require("fs");
const axios = require("axios");
const zlib = require("zlib");

const htmlFormatter = {
  bold: (text) => `<b>${text}</b>`,
  italic: (text) => `<i>${text}</i>`,
  underline: (text) => `<u>${text}</u>`,
  strike: (text) => `<s>${text}</s>`,
  link: (text, url) => `<a href="${url}">${text}</a>`,
  br: () => `<br/>`,
  hr: () => `<hr/>`,
  code: (text) => `<code>${text}</code>`,
  pre: (text) => `<pre>${text}</pre>`,
  blockquote: (text) => `<blockquote>${text}</blockquote>`,
};

async function createPdf(arr, path) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false });

    for (let i of arr) {
      try {
        const image = doc.openImage(i);
        doc.addPage({ size: [image.width, image.height] });
        doc.image(image, 0, 0);
      } catch (error) {
        console.log(error);
      }
    }

    const stream = fs.createWriteStream(path);

    doc.pipe(stream);

    stream.on("finish", async () => {
      try {
        let buffer = await fs.promises.readFile(path);
        await fs.promises.unlink(path);
        resolve(buffer);
      } catch (error) {
        reject(error);
      }
    });

    doc.on("error", (error) => {
      reject(error);
    });

    doc.end();
  });
}

function dl(text, retries = 5) {
  return new Promise((resolve, reject) => {
    const downloadWithRetries = async (retryCount) => {
      try {
        const response = await axios({
          method: "get",
          url: text,
          responseType: "arraybuffer",
          timeout: 60000,
        });

        if (response.data instanceof Buffer) {
          resolve(response.data);
        } else {
          const buffer = Buffer.from(response.data);
          resolve(buffer);
        }
      } catch (error) {
        console.error(`Error downloading: ${text}`);
        if (retryCount > 0) {
          console.log(`Retrying... (attempts left: ${retryCount})`);
          await new Promise((r) => setTimeout(r, 1000));
          await downloadWithRetries(retryCount - 1);
        } else {
          console.error("Exceeded maximum retries. Giving up.");
          reject(error);
        }
      }
    };

    downloadWithRetries(retries);
  });
}
function compressText(text) {
  const originalBuffer = Buffer.from(text);
  const compressedBuffer = zlib.deflateSync(originalBuffer);
  if (compressedBuffer.length < originalBuffer.length) {
    return compressedBuffer;
  }
  return originalBuffer;
}

function decompressText(buffer) {
  try {
    const decompressedBuffer = zlib.inflateSync(buffer);
    return decompressedBuffer.toString();
  } catch (error) {
    return buffer.toString();
  }
}
module.exports = { htmlFormatter, createPdf, dl, compressText, decompressText};
