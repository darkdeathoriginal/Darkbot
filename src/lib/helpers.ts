import sharp from "sharp";
import PDFDocument from "pdfkit"
import axios, { AxiosRequestConfig } from "axios";
const fs = require("fs");
const zlib = require("zlib");

const htmlFormatter = {
  bold: (text:string) => `<b>${text}</b>`,
  italic: (text:string) => `<i>${text}</i>`,
  underline: (text:string) => `<u>${text}</u>`,
  strike: (text:string) => `<s>${text}</s>`,
  link: (text:string, url:string) => `<a href="${url}">${text}</a>`,
  br: () => `<br/>`,
  hr: () => `<hr/>`,
  code: (text:string) => `<code>${text}</code>`,
  pre: (text:string) => `<pre>${text}</pre>`,
  blockquote: (text:string) => `<blockquote>${text}</blockquote>`,
};

async function createPdf(arr:string[], path:string, sendPath = false, isLarge = false) {
  const doc = new PDFDocument({ autoFirstPage: false });
  const stream = fs.createWriteStream(path);
  doc.pipe(stream);

  try {
    for (let imagePath of arr) {
      await processImage(imagePath, doc, isLarge);
    }
  } catch (error) {
    console.error("Error processing images:", error);
    doc.end();
    stream.end();
    await fs.promises.unlink(path).catch(console.error);
    throw error;
  }

  doc.end();

  return new Promise((resolve, reject) => {
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

    stream.on("error", reject);
  });
}

async function processImage(imagePath:string, doc:PDFKit.PDFDocument, isLarge:boolean) {
  try {
    const newPath = imagePath + ".jpeg";
    let finalPath, metadata;

    if (isLarge) {
      finalPath = newPath;
      metadata = await sharp(imagePath)
        .toFormat("jpeg", { quality: 80, mozjpeg: true })
        .toFile(newPath);
    } else {
      finalPath = imagePath;
      metadata = await sharp(imagePath).metadata();
    }
    if(metadata.width == undefined || metadata.height == undefined) throw Error("Cannot file dimensions")
    doc.addPage({ size: [metadata.width, metadata.height] });
    doc.image(finalPath, 0, 0);

    if (isLarge) {
      await fs.promises.unlink(newPath).catch(console.error);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unknown image format")) {
      console.log("Error: Unknown image format");
      const newPath = imagePath + ".jpeg";
      const metadata = await sharp(imagePath)
        .toFormat("jpeg", { quality: 80, mozjpeg: true })
        .toFile(newPath);
      
      doc.addPage({ size: [metadata.width, metadata.height] });
      doc.image(newPath, 0, 0);
      
      await fs.promises.unlink(newPath).catch(console.error);
    } else {
      throw error;
    }
  }
}



async function dl(url: string, path = false, options: Partial<AxiosRequestConfig> = {}) {
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
          const chunks:Buffer[]= [];
          let totalLength = 0;
          response.data.on('data', (chunk:Buffer) => {
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


function compressText(text:string) {
  const originalBuffer = Buffer.from(text);
  const compressedBuffer = zlib.deflateSync(originalBuffer);
  if (compressedBuffer.length < originalBuffer.length) {
    return compressedBuffer;
  }
  return originalBuffer;
}

function decompressText(buffer:Buffer) {
  try {
    const decompressedBuffer = zlib.inflateSync(buffer);
    return decompressedBuffer.toString();
  } catch (error) {
    return buffer.toString();
  }
}
class Mutex {
  locked:boolean
  waitingList:(() => void)[]
  constructor() {
    this.locked = false;
    this.waitingList = [];
  }

  async acquire() {
    while (this.locked) {
      await new Promise<void>((resolve) => this.waitingList.push(resolve));
    }
    this.locked = true;
  }

  release() {
    if (this.waitingList.length > 0) {
      const resolve = this.waitingList.shift();
      if(resolve){
        resolve()
      }
    } else {
      this.locked = false;
    }
  }
}
class Semaphore {
  count:number
  waitingList:{resolve:()=>void,position:number}[]
  lock:Mutex
  positionChangeCallbacks: {position:number,callback:((position: number) => void)}[];
  constructor(initialCount:number) {
    this.count = initialCount;
    this.waitingList = [];
    this.lock = new Mutex();
    this.positionChangeCallbacks = []; // Map to store callbacks for each waiting task
  }

  async acquire(callback:(position: number) => void) {
    await this.lock.acquire();
    if (this.count > 0) {
      this.count--;
      this.lock.release();
    } else {
      const position = this.waitingList.length + 1;
      const promise = new Promise<void>((resolve) => {
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
      const waiting = this.waitingList.shift();
      for (let i of this.positionChangeCallbacks) {
        i.position--;
        if (i.position <= 0) {
          this.positionChangeCallbacks.shift();
          continue;
        }
        i.callback(i.position);
      }
      waiting?.resolve();
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
