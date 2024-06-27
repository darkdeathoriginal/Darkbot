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

async function createPdf(arr, outputPath, sendPath = false) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    (async () => {
      for (const imgPath of arr) {
        try {
          const image = doc.openImage(imgPath);
          doc.addPage({ size: [image.width, image.height] });
          doc.image(image, 0, 0);
        } catch (error) {
          console.error(`Error processing image ${imgPath}:`, error);
        }
      }
      doc.end();
    })();

    stream.on('finish', async () => {
      try {
        if (sendPath) {
          resolve(outputPath);
        } else {
          const buffer = await fs.promises.readFile(outputPath);
          await fs.promises.unlink(outputPath);
          resolve(buffer);
        }
      } catch (error) {
        reject(error);
      }
    });

    stream.on('error', (error) => {
      reject(error);
    });

    doc.on('error', (error) => {
      reject(error);
    });
  });
}


function dl(url, path = false, options) {
  const retries = 5;

  return new Promise((resolve, reject) => {
    const downloadWithRetries = async (retryCount) => {
      try {
        const response = await axios({
          method: 'get',
          url: url,
          responseType: 'stream',
          timeout: 60000,
          ...options,
        });

        if (path) {
          const writer = fs.createWriteStream(path);
          response.data.pipe(writer);

          writer.on('finish', () => resolve(path));
          writer.on('error', reject);
        } else {
          const chunks = [];
          response.data.on('data', (chunk) => chunks.push(chunk));
          response.data.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
          });
          response.data.on('error', reject);
        }
      } catch (error) {
        console.error(`Error downloading: ${url}`);
        if (retryCount > 0) {
          console.log(`Retrying... (attempts left: ${retryCount})`);
          await new Promise((r) => setTimeout(r, 1000));
          await downloadWithRetries(retryCount - 1);
        } else {
          console.error('Exceeded maximum retries. Giving up.');
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
