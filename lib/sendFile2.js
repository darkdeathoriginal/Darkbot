const { utils, Api, errors } = require("telegram");
const {
  readBigIntFromBuffer,
  generateRandomBytes,
} = require("telegram/Helpers");
const {
  getInputMedia,
  getMessageId,
  getAppropriatedPartSize,
} = require("telegram/Utils");
const { _parseMessageText } = require("telegram/client/messageParse");
const { getCommentData } = require("telegram/client/messages");
const { CustomFile } = require("telegram/client/uploads");
const bigInt = require("big-integer");
const fs = require("fs/promises");
const { Buffer } = require("buffer");
const { isBuffer } = Buffer;

const KB_TO_BYTES = 1024;
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024;
const UPLOAD_TIMEOUT = 15 * 1000;
const DISCONNECT_SLEEP = 1000;
const BUFFER_SIZE_2GB = 2 ** 31;
const BUFFER_SIZE_100MB = 100 * 1024 * 1024;
const BUFFER_SIZE_20MB = 20 * 1024 * 1024;

class CustomBuffer {
  constructor(options) {
    if (!options.buffer && !options.filePath) {
      throw new Error(
        "Either one of `buffer` or `filePath` should be specified"
      );
    }
    this.options = options;
  }

  async slice(begin, end) {
    const { buffer, filePath } = this.options;
    if (buffer) {
      return buffer.slice(begin, end);
    } else if (filePath) {
      const buffSize = end - begin;
      const buff = Buffer.alloc(buffSize);
      const fHandle = await fs.open(filePath, "r");

      await fHandle.read(buff, 0, buffSize, begin);
      await fHandle.close();

      return Buffer.from(buff);
    }

    return Buffer.alloc(0);
  }
}

async function getFileBuffer(file, fileSize, maxBufferSize) {
  const options = {};
  if (fileSize > maxBufferSize && file instanceof CustomFile) {
    options.filePath = file.path;
  } else {
    options.buffer = Buffer.from(await fileToBuffer(file));
  }

  return new CustomBuffer(options);
}

async function uploadFile(client, fileParams) {
  const { file, onProgress } = fileParams;
  let { workers } = fileParams;

  const { name, size } = file;
  const fileId = readBigIntFromBuffer(generateRandomBytes(8), true, true);
  const isLarge = size > LARGE_FILE_THRESHOLD;

  const partSize = getAppropriatedPartSize(bigInt(size)) * KB_TO_BYTES;
  const partCount = Math.floor((size + partSize - 1) / partSize);

  // Make sure a new sender can be created before starting upload
  await client.getSender(client.session.dcId);

  if (!workers || !size) {
    workers = 1;
  }
  if (workers >= partCount) {
    workers = partCount;
  }

  let progress = 0;
  if (onProgress) {
    onProgress(progress);
  }
  
  const buffer = await getFileBuffer(
    file,
    size,
    fileParams.maxBufferSize || BUFFER_SIZE_20MB - 1
  );
  for (let i = 0; i < partCount; i += workers) {
    const sendingParts = [];
    let end = i + workers;
    if (end > partCount) {
      end = partCount;
    }

    for (let j = i; j < end; j++) {
      const bytes = await buffer.slice(j * partSize, (j + 1) * partSize);
      // eslint-disable-next-line no-loop-func
      sendingParts.push(
        (async (jMemo, bytesMemo) => {
          while (true) {
            let sender;
            try {
              // We always upload from the DC we are in
              sender = await client.getSender(client.session.dcId);
              await sender.send(
                isLarge
                  ? new Api.upload.SaveBigFilePart({
                      fileId,
                      filePart: jMemo,
                      fileTotalParts: partCount,
                      bytes: bytesMemo,
                    })
                  : new Api.upload.SaveFilePart({
                      fileId,
                      filePart: jMemo,
                      bytes: bytesMemo,
                    })
              );
            } catch (err) {
              if (sender && !sender.isConnected()) {
                await sleep(DISCONNECT_SLEEP);
                continue;
              } else if (err instanceof errors.FloodWaitError) {
                await sleep(err.seconds * 1000);
                continue;
              }
              throw err;
            }

            if (onProgress) {
              if (onProgress.isCanceled) {
                throw new Error("USER_CANCELED");
              }

              progress += 1 / partCount;
              onProgress(progress);
            }
            break;
          }
        })(j, bytes)
      );
    }

    await Promise.all(sendingParts);
  }


  return isLarge
    ? new Api.InputFileBig({
        id: fileId,
        parts: partCount,
        name,
      })
    : new Api.InputFile({
        id: fileId,
        parts: partCount,
        name,
        md5Checksum: "", // This is not a "flag", so not sure if we can make it optional.
      });
}

async function _fileToMedia(
  client,
  {
    file,
    forceDocument,
    fileSize,
    progressCallback,
    attributes,
    thumb,
    voiceNote = false,
    videoNote = false,
    supportsStreaming = false,
    mimeType,
    asImage,
    workers = 1,
  }
) {
  if (!file) {
    return { fileHandle: undefined, media: undefined, image: undefined };
  }
  const isImage = utils.isImage(file);

  if (asImage == undefined) {
    asImage = isImage && !forceDocument;
  }
  if (
    typeof file == "object" &&
    !Buffer.isBuffer(file) &&
    !(file instanceof Api.InputFile) &&
    !(file instanceof Api.InputFileBig) &&
    !(file instanceof CustomFile) &&
    !("read" in file)
  ) {
    try {
      return {
        fileHandle: undefined,
        media: utils.getInputMedia(file, {
          isPhoto: asImage,
          attributes: attributes,
          forceDocument: forceDocument,
          voiceNote: voiceNote,
          videoNote: videoNote,
          supportsStreaming: supportsStreaming,
        }),
        image: asImage,
      };
    } catch (e) {
      return {
        fileHandle: undefined,
        media: undefined,
        image: isImage,
      };
    }
  }
  let media;
  let fileHandle;
  let createdFile;

  if (file instanceof Api.InputFile || file instanceof Api.InputFileBig) {
    fileHandle = file;
  } else if (
    typeof file == "string" &&
    (file.startsWith("https://") || file.startsWith("http://"))
  ) {
    if (asImage) {
      media = new Api.InputMediaPhotoExternal({ url: file });
    } else {
      media = new Api.InputMediaDocumentExternal({ url: file });
    }
  } else if (!(typeof file == "string") || (await fs.lstat(file)).isFile()) {
    if (typeof file == "string") {
      createdFile = new CustomFile(
        path.basename(file),
        (await fs.stat(file)).size,
        file
      );
    } else if (
      (typeof File !== "undefined" && file instanceof File) ||
      file instanceof CustomFile
    ) {
      createdFile = file;
    } else {
      let name;
      if ("name" in file) {
        // @ts-ignore
        name = file.name;
      } else {
        name = "unnamed";
      }
      if (Buffer.isBuffer(file)) {
        createdFile = new CustomFile(name, file.length, "", file);
      }
    }
    if (!createdFile) {
      throw new Error(`Could not create file from ${JSON.stringify(file)}`);
    }
    fileHandle = await uploadFile(client, {
      file: createdFile,
      onProgress: progressCallback,
      workers: workers,
    });
  } else {
    throw new Error(`"Not a valid path nor a url ${file}`);
  }
  if (media != undefined) {
  } else if (fileHandle == undefined) {
    throw new Error(
      `Failed to convert ${file} to media. Not an existing file or an HTTP URL`
    );
  } else if (asImage) {
    media = new Api.InputMediaUploadedPhoto({
      file: fileHandle,
    });
  } else {
    // @ts-ignore
    let res = utils.getAttributes(file, {
      mimeType: mimeType,
      attributes: attributes,
      forceDocument: forceDocument && !isImage,
      voiceNote: voiceNote,
      videoNote: videoNote,
      supportsStreaming: supportsStreaming,
      thumb: thumb,
    });
    attributes = res.attrs;
    mimeType = res.mimeType;

    let uploadedThumb;
    if (!thumb) {
      uploadedThumb = undefined;
    } else {
      // todo refactor
      if (typeof thumb == "string") {
        uploadedThumb = new CustomFile(
          path.basename(thumb),
          (await fs.stat(thumb)).size,
          thumb
        );
      } else if (typeof File !== "undefined" && thumb instanceof File) {
        uploadedThumb = thumb;
      } else {
        let name;
        if ("name" in thumb) {
          name = thumb.name;
        } else {
          name = "unnamed";
        }
        if (Buffer.isBuffer(thumb)) {
          uploadedThumb = new CustomFile(name, thumb.length, "", thumb);
        }
      }
      if (!uploadedThumb) {
        throw new Error(`Could not create file from ${file}`);
      }
      uploadedThumb = await uploadFile(client, {
        file: uploadedThumb,
        workers: 1,
      });
    }
    media = new Api.InputMediaUploadedDocument({
      file: fileHandle,
      mimeType: mimeType,
      attributes: attributes,
      thumb: uploadedThumb,
      forceFile: forceDocument && !isImage,
    });
  }
  return {
    fileHandle: fileHandle,
    media: media,
    image: asImage,
  };
}

/** @hidden */
async function _sendAlbum(
  client,
  entity,
  {
    file,
    caption,
    forceDocument = false,
    fileSize,
    clearDraft = false,
    progressCallback,
    replyTo,
    attributes,
    thumb,
    parseMode,
    voiceNote = false,
    videoNote = false,
    silent,
    supportsStreaming = false,
    scheduleDate,
    workers = 1,
    noforwards,
    commentTo,
    topMsgId,
  }
) {
  entity = await client.getInputEntity(entity);
  let files = [];
  if (!Array.isArray(file)) {
    files = [file];
  } else {
    files = file;
  }
  if (!Array.isArray(caption)) {
    if (!caption) {
      caption = "";
    }
    caption = [caption];
  }
  const captions = [];
  for (const c of caption) {
    captions.push(await _parseMessageText(client, c, parseMode));
  }
  if (commentTo != undefined) {
    const discussionData = await getCommentData(client, entity, commentTo);
    entity = discussionData.entity;
    replyTo = discussionData.replyTo;
  } else {
    replyTo = utils.getMessageId(replyTo);
  }
  if (!attributes) {
    attributes = [];
  }

  let index = 0;
  const albumFiles = [];
  for (const file of files) {
    let { fileHandle, media, image } = await _fileToMedia(client, {
      file: file,
      forceDocument: forceDocument,
      fileSize: fileSize,
      progressCallback: progressCallback,
      // @ts-ignore
      attributes: attributes[index],
      thumb: thumb,
      voiceNote: voiceNote,
      videoNote: videoNote,
      supportsStreaming: supportsStreaming,
      workers: workers,
    });
    index++;
    if (
      media instanceof Api.InputMediaUploadedPhoto ||
      media instanceof Api.InputMediaPhotoExternal
    ) {
      const r = await client.invoke(
        new Api.messages.UploadMedia({
          peer: entity,
          media,
        })
      );
      if (r instanceof Api.MessageMediaPhoto) {
        media = getInputMedia(r.photo);
      }
    } else if (media instanceof Api.InputMediaUploadedDocument) {
      const r = await client.invoke(
        new Api.messages.UploadMedia({
          peer: entity,
          media,
        })
      );
      if (r instanceof Api.MessageMediaDocument) {
        media = getInputMedia(r.document);
      }
    }
    let text = "";
    let msgEntities = [];
    if (captions.length) {
      [text, msgEntities] = captions.shift();
    }
    albumFiles.push(
      new Api.InputSingleMedia({
        media: media,
        message: text,
        entities: msgEntities,
      })
    );
  }
  let replyObject = undefined;
  if (replyTo != undefined) {
    replyObject = new Api.InputReplyToMessage({
      replyToMsgId: getMessageId(replyTo),
      topMsgId: getMessageId(topMsgId),
    });
  }

  const result = await client.invoke(
    new Api.messages.SendMultiMedia({
      peer: entity,
      replyTo: replyObject,
      multiMedia: albumFiles,
      silent: silent,
      scheduleDate: scheduleDate,
      clearDraft: clearDraft,
      noforwards: noforwards,
    })
  );
  const randomIds = albumFiles.map((m) => m.randomId);
  return client._getResponseMessage(randomIds, result, entity);
}

async function sendFile(
  client,
  entity,
  {
    file,
    caption,
    forceDocument = false,
    fileSize,
    clearDraft = false,
    progressCallback,
    replyTo,
    attributes,
    thumb,
    parseMode,
    formattingEntities,
    voiceNote = false,
    videoNote = false,
    buttons,
    silent,
    supportsStreaming = false,
    scheduleDate,
    workers = 1,
    noforwards,
    commentTo,
    topMsgId,
  }
) {
  if (!file) {
    throw new Error("You need to specify a file");
  }
  if (!caption) {
    caption = "";
  }
  entity = await client.getInputEntity(entity);
  if (commentTo != undefined) {
    const discussionData = await getCommentData(client, entity, commentTo);
    entity = discussionData.entity;
    replyTo = discussionData.replyTo;
  } else {
    replyTo = utils.getMessageId(replyTo);
  }
  if (Array.isArray(file)) {
    return await _sendAlbum(client, entity, {
      file: file,
      caption: caption,
      replyTo: replyTo,
      parseMode: parseMode,
      attributes: attributes,
      silent: silent,
      scheduleDate: scheduleDate,
      supportsStreaming: supportsStreaming,
      clearDraft: clearDraft,
      forceDocument: forceDocument,
      noforwards: noforwards,
      topMsgId: topMsgId,
    });
  }
  if (Array.isArray(caption)) {
    caption = caption[0] || "";
  }
  let msgEntities;
  if (formattingEntities != undefined) {
    msgEntities = formattingEntities;
  } else {
    [caption, msgEntities] = await _parseMessageText(
      client,
      caption,
      parseMode
    );
  }

  const { fileHandle, media, image } = await _fileToMedia(client, {
    file: file,
    forceDocument: forceDocument,
    fileSize: fileSize,
    progressCallback: progressCallback,
    // @ts-ignore
    attributes: attributes,
    thumb: thumb,
    voiceNote: voiceNote,
    videoNote: videoNote,
    supportsStreaming: supportsStreaming,
    workers: workers,
  });
  if (media == undefined) {
    throw new Error(`Cannot use ${file} as file.`);
  }
  const markup = client.buildReplyMarkup(buttons);
  let replyObject = undefined;
  if (replyTo != undefined) {
    replyObject = new Api.InputReplyToMessage({
      replyToMsgId: getMessageId(replyTo),
      topMsgId: getMessageId(topMsgId),
    });
  }

  const request = new Api.messages.SendMedia({
    peer: entity,
    media: media,
    replyTo: replyObject,
    message: caption,
    entities: msgEntities,
    replyMarkup: markup,
    silent: silent,
    scheduleDate: scheduleDate,
    clearDraft: clearDraft,
    noforwards: noforwards,
  });
  const result = await client.invoke(request);
  return client._getResponseMessage(request, result, entity);
}

function fileToBuffer(file) {
  if (typeof File !== "undefined" && file instanceof File) {
    return new Response(file).arrayBuffer();
  } else if (file instanceof CustomFile) {
    if (file.buffer != undefined) {
      return file.buffer;
    } else {
      return fs.readFile(file.path);
    }
  } else {
    throw new Error("Could not create buffer from file " + file);
  }
}

module.exports = { sendFile2: sendFile };
