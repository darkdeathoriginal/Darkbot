const PDFDocument = require("pdfkit");
const fs = require("fs");
const axios = require("axios");
const zlib = require("zlib");
const sharp = require("sharp");

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

async function createPdf(arr, path, sendPath = false, isLarge = false) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(path);
    doc.pipe(stream);

    const processImage = async (imagePath) => {
      try {
        const newPath = imagePath + ".jpeg";
        let finalPath
        let metadata
        if(isLarge){
          finalPath = newPath
          metadata = await sharp(imagePath)
            .toFormat("jpeg", { quality: 80, mozjpeg: true })
            .toFile(newPath)
            .then((info) => info);
        }
        else{
          finalPath = imagePath
          metadata = await sharp(imagePath).metadata();
        }

        doc.addPage({ size: [metadata.width, metadata.height] });
        doc.image(finalPath, 0, 0);
      } catch (error) {
        if(error.message.includes("Unknown image format")){
          console.log("Error: Unknown image format");
          const newPath = imagePath + ".jpeg";
          const metadata = await sharp(imagePath)
            .toFormat("jpeg", { quality: 80, mozjpeg: true })
            .toFile(newPath)
            .then((info) => info);
          doc.addPage({ size: [metadata.width, metadata.height] });
          doc.image(newPath, 0, 0);
          return
        }
        console.error(error);
        reject(error);
      }
    };

    (async () => {
      for (let imagePath of arr) {
        await processImage(imagePath);
      }
      doc.end();
    })();

    stream.on("finish", async () => {
      try {
        if (sendPath) return resolve(path);
        const buffer = await fs.promises.readFile(path);
        await fs.promises.unlink(path);
        resolve(buffer);
      } catch (error) {
        reject(error);
      }
    });

    doc.on("error", (error) => {
      reject(error);
    });
  });
}



async function dl(url, path = false, options) {
  const retries = 5;
  const retryDelay = 1000;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        timeout: 60000,
        ...options,
      });

      if (path) {
        return new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(path);
          response.data.pipe(writer);
          writer.on('finish', () => resolve(path));
          writer.on('error', reject);
        });
      } else {
        return new Promise((resolve, reject) => {
          const chunks = [];
          let totalLength = 0;
          response.data.on('data', (chunk) => {
            chunks.push(chunk);
            totalLength += chunk.length;
          });
          response.data.on('end', () => {
            const buffer = Buffer.concat(chunks, totalLength);
            resolve(buffer);
          });
          response.data.on('error', reject);
        });
      }
    } catch (error) {
      console.error(`Error downloading: ${url}`);
      if (i < retries - 1) {
        console.log(`Retrying... (attempts left: ${retries - i - 1})`);
        await new Promise(r => setTimeout(r, retryDelay));
      } else {
        console.error('Exceeded maximum retries. Giving up.');
        throw error;
      }
    }
  }
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
class Mutex {
  constructor() {
    this.locked = false;
    this.waitingList = [];
  }

  async acquire() {
    while (this.locked) {
      await new Promise((resolve) => this.waitingList.push(resolve));
    }
    this.locked = true;
  }

  release() {
    if (this.waitingList.length > 0) {
      const resolve = this.waitingList.shift();
      resolve();
    } else {
      this.locked = false;
    }
  }
}
class Semaphore {
  constructor(initialCount) {
    this.count = initialCount;
    this.waitingList = [];
    this.lock = new Mutex();
    this.positionChangeCallbacks = []; // Map to store callbacks for each waiting task
  }

  async acquire(callback) {
    await this.lock.acquire();
    if (this.count > 0) {
      this.count--;
      this.lock.release();
    } else {
      const position = this.waitingList.length + 1;
      const promise = new Promise((resolve) => {
        this.waitingList.push({ resolve, position });
      });
      if (typeof callback === "function") {
        callback(position);
        this.positionChangeCallbacks.push({ position, callback });
      }
      this.lock.release();
      await promise;
      this.count--;
    }
  }

  release() {
    this.count++;
    if (this.waitingList.length > 0) {
      const { resolve, position } = this.waitingList.shift();
      for (let i of this.positionChangeCallbacks) {
        i.position--;
        if (i.position <= 0) {
          this.positionChangeCallbacks.shift();
          continue;
        }
        i.callback(i.position);
      }
      resolve();
    }
  }

  getCurrentWaitingList() {
    return this.waitingList.map(({ position, resolve }) => ({
      position,
      resolve,
    }));
  }
}
module.exports = {
  htmlFormatter,
  createPdf,
  dl,
  compressText,
  decompressText,
  Semaphore,
};
