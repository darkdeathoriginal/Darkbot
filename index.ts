/// <reference path="./types.js" />
const { Logger, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const input = require("input");
const fs = require("fs");
const simpleGit = require("simple-git");
const { LogLevel } = require("telegram/extensions/Logger");
const Message = require("./lib/Message");
const { CreateClient } = require("./lib/createClient");
const git = simpleGit();
require("dotenv").config();
const { apiId, apiHash, setSudo } = require("./config");
const ExternalPluginDb = require("./modals/externalPlugins");
const axios = require("axios");
const express = require("express");
const qrcode = require("qrcode");
const http = require("http");
const KeyStoreDb = require("./modals/keystore");
const { dl } = require("./lib/helpers");
const sharp = require("sharp");
const { CustomFile } = require("telegram/client/uploads");

const modules = [];

/**
 *
 * @type {Module}
 */
function Module(moduleConfig, callback) {
  modules.push({ ...moduleConfig, callback });
}

(async () => {
  console.log("Bot is starting...");
  await KeyStoreDb.sync();
  const session = await KeyStoreDb.findOne({ where: { key: "session" } });
  const stringSession = new StringSession(session?.value || "");
  const client = new CreateClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
    baseLogger: new Logger(LogLevel.ERROR),
  });

  client.addEventHandler(async (event) => {
    let test = new Message(client, event.message);
    console.log(event.message.peerId);

    const message = event.message.message;
    const sender = await event.message.getSender();

    if (message) {
      for (const module of modules) {
        if ((module.fromMe && sender.self) || !module.fromMe) {
          const regex = new RegExp(`^\\.\\s*${module.pattern}`);
          const match = message.match(regex);
          if (match) {
            module.callback(test, match);
          }
        }
      }
    }
    for (const module of modules) {
      if (
        module.on &&
        module.on == "message" &&
        ((module.fromMe && sender.self) || !module.fromMe)
      ) {
        module.callback(test);
      }
    }
  }, new NewMessage({}));
  if (!session) {
    if (process.env.WEB_LOGIN_ENABLED === "true") {
      const runLoginServer = () => {
        return new Promise((resolve, reject) => {
          const app = express();
          const server = http.createServer(app);
          app.use(express.json());

          let passwordResolver;
          let qrCodeDataUri = "";
          let loginStatus = "INITIALIZING";
          let statusMessage = "Server is starting...";

          const passwordPromise = new Promise((res) => {
            passwordResolver = res;
          });

          // --- Server routes ---
          // Login page
          app.get("/login", (req, res) => {
            fs.readFile("./login.html", "utf8", (err, html) => {
              if (err)
                return res.status(500).send("Error: Could not load login.html");
              const pageContent = html.replace(
                "%%QR_CODE_IMAGE%%",
                `<img src="${qrCodeDataUri}" alt="QR Code">`,
              );
              res.send(pageContent);
            });
          });

          // Health check endpoints
          app.get("/", (req, res) => {
            if (loginStatus === "LOGGED_IN") {
              res.json({
                status: "alive",
                message: "Darkbot is running",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
              });
            } else {
              // Redirect to login during setup
              res.redirect("/login");
            }
          });

          app.get("/health", (req, res) => {
            res.json({
              status: loginStatus === "LOGGED_IN" ? "healthy" : "initializing",
              bot: loginStatus === "LOGGED_IN" ? "online" : "starting",
              loginStatus: loginStatus,
              timestamp: new Date().toISOString(),
            });
          });

          app.get("/status", (req, res) =>
            res.json({ status: loginStatus, message: statusMessage }),
          );
          app.post("/submit-password", (req, res) => {
            const { password } = req.body;
            if (password && passwordResolver) {
              statusMessage = "Password submitted. Waiting for Telegram...";
              passwordResolver(password);
              res.json({ success: true });
            } else {
              res
                .status(400)
                .json({ success: false, message: "Password not provided." });
            }
          });

          server.on("error", (err) => {
            console.error("Server error:", err);
            reject(err);
          });

          const PORT = process.env.PORT || 3000;
          server.listen(PORT, async () => {
            console.log(
              `Combined login/health server started on port ${PORT}. Please open http://localhost:${PORT}/login in your browser.`,
            );
            try {
              await client.connect();

              await client.signInUserWithQrCode(
                { apiId, apiHash },
                {
                  qrCode: async (code) => {
                    const token = code.token.toString("base64url");
                    const url = `tg://login?token=${token}`;
                    qrCodeDataUri = await qrcode.toDataURL(url);
                    loginStatus = "WAITING_FOR_SCAN";
                    statusMessage = "Please scan the QR code in your browser.";
                    console.log(
                      "QR Code generated. Waiting for scan on the webpage.",
                    );
                  },
                  password: () => {
                    loginStatus = "PASSWORD_NEEDED";
                    statusMessage = "2FA Password Required.";
                    console.log(
                      "Telegram is requesting 2FA password. Waiting for input on webpage.",
                    );
                    return passwordPromise;
                  },
                  onError: (err) => {
                    loginStatus = "ERROR";
                    statusMessage = `An error occurred: ${err.message}`;
                    console.error("Error during QR login:", err);
                  },
                },
              );

              loginStatus = "LOGGED_IN";
              statusMessage =
                "Success! Login complete. Server will continue running for health checks.";
              console.log(
                "Login successful via web interface! Server will continue running.",
              );

              // Don't close the server anymore - keep it running for health checks
              resolve(undefined);
            } catch (error) {
              loginStatus = "ERROR";
              statusMessage = `Login failed: ${error.message}`;
              console.error("Failed to complete web login:", error);
              resolve(undefined); // Still resolve to continue bot initialization
            }
          });
        });
      };

      // Now we just await the function that encapsulates everything.
      await runLoginServer();
    } else {
      // ---- Fallback interactive login ----
      await client.start({
        phoneNumber: async () => await input.text("number ?"),
        password: async () => await input.text("password?"),
        phoneCode: async () => await input.text("Code ?"),
        onError: (err) => console.log(err),
      });
    }
    console.log("Login successful! Saving session to .env file...");
    const newSessionString = client.session.save();
    await KeyStoreDb.upsert({ key: "session", value: newSessionString });
    console.log("Session saved. Please restart the bot.");
  }
  await client.connect();
  console.log("Bot is ready.");
  const me = await client.getMe();
  setSudo(me.id);
  require("./bot/index");
  await client.getDialogs();
  for (const module of modules) {
    if (module.on && module.on == "start") {
      module.callback(client);
    }
  }
  await client.sendMessage("me", { message: "Bot has been started.." });
  var commits = await git.log(["main" + "..origin/" + "main"]);
  var mss = "";
  if (commits.total != 0) {
    var changelog = "_Pending updates:_\n\n";
    for (var i in commits.all) {
      changelog += `${parseInt(i) + 1}• **${commits.all[i].message}**\n`;
    }
    changelog += `\n_Use ".update start" to start the update_`;
    await client.sendMessage("me", { message: changelog });
  }

  // Start health server if not already running (for when session exists)
  if (process.env.WEB_LOGIN_ENABLED !== "true" || session) {
    const healthApp = express();
    const PORT = process.env.PORT || 3000;
    healthApp.use(express.json());

    // Health check endpoints
    healthApp.get("/", (req, res) => {
      res.json({
        status: "alive",
        message: "Darkbot is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    healthApp.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        bot: "online",
        timestamp: new Date().toISOString(),
      });
    });
    healthApp.post("/create_channel", (req, res) => {
      const { channelName, thumb, users, referrer, folderId } = req.body;
      createChannel(channelName, thumb, users, referrer, folderId, client)
        .then((result) => {
          //201 status
          res.status(201).json({ message: "success", ...result });
        })
        .catch((error) => {
          res.json({ message: "error", error: error.message });
        });
    });

    healthApp.listen(PORT, () => {
      console.log(`Health server running on port ${PORT}`);
    });
  }
})();
Module(
  { pattern: "start", fromMe: true, desc: "Start command", use: "utility" },
  async (m) => {
    const sender = await m.message.getSender();
    await m.client.sendMessage(sender, {
      message: `Hi, your ID is ${m.message.senderId}`,
    });
  },
);

module.exports = {
  Module,
  modules,
};
(async () => {
  await ExternalPluginDb.sync();
  let plugins = await ExternalPluginDb.findAll();
  await plugins.forEach(async (plugin) => {
    const pluginName = plugin.name;
    const pluginUrl = plugin.url;
    if (!fs.existsSync("./plugins/" + pluginName + ".js")) {
      try {
        var url = new URL(pluginUrl);
      } catch {
        console.log("Invalid URL");
      }
      let urlStr = "";
      if (
        url.host === "gist.github.com" ||
        url.host === "gist.githubusercontent.com"
      ) {
        urlStr = !url?.toString().endsWith("raw")
          ? url.toString() + "/raw"
          : url.toString();
      } else {
        urlStr = url.toString();
      }
      try {
        var response = await axios(urlStr + "?timestamp=" + new Date());
      } catch (e) {
        console.log(e);
      }

      fs.writeFileSync("./plugins/" + pluginName + ".js", response.data);
    }
  });
  const pluginFolder = "./plugins/";
  const files = fs.readdirSync(pluginFolder);

  files.forEach((file) => {
    if (file.endsWith(".js")) {
      const filePath = pluginFolder + file;
      require(filePath);
    }
  });
})();
async function createChannel(
  channelName,
  thumb,
  users,
  referrer,
  folderId,
  client,
) {
  try {
    const payload = new Api.channels.CreateChannel({
      title: channelName,
      broadcast: true,
      about: "Main:- @allinonemanga",
    });
    let res = await client.invoke(payload);
    console.log("Channel created:", res.chats[0].id);

    if (folderId) {
      try {
        await axios.post(`http://20.55.33.37:8080/add_chat_to_folder`, {
          folderId,
          chatId: res.chats[0].id,
        });
      } catch (error) {
        console.error("Error adding chat to folder:", error);
      }
    }

    if (thumb) {
      // Download the original image into a buffer
      const originalBuffer = await dl(thumb, undefined, {
        headers: {
          Referer: referrer,
        },
      });

      // --- START: NEW IMAGE RESIZING LOGIC ---
      console.log("Resizing image...");
      const resizedBuffer = await sharp(originalBuffer)
        .resize(512, 512, {
          fit: "cover", // Crop to cover both dimensions, no distortion
          position: "centre", // Crop from the center
        })
        .png() // You can specify format, e.g., png() or jpeg()
        .toBuffer();
      console.log("Image resized successfully.");
      // --- END: NEW IMAGE RESIZING LOGIC ---

      // Upload the NEW, RESIZED buffer
      const photo = await client.uploadFile({
        file: new CustomFile(
          "profile.png",
          resizedBuffer.length,
          "",
          resizedBuffer,
        ),
      });
      console.log("Uploaded resized photo:", photo);

      const resp = await client.invoke(
        new Api.channels.EditPhoto({
          channel: res.chats[0].id,
          photo: photo, // Use the result of the upload
        }),
      );

      // Delete the "User changed group photo" service message
      if (resp.updates && resp.updates[0] && resp.updates[0].id) {
        await client.deleteMessages(res.chats[0].id, [resp.updates[0].id], {
          revoke: true,
        });
      }
    }

    if (users && Array.isArray(users)) {
      for (const user of users) {
        try {
          const userEntity = await client.getEntity(user);
          if (userEntity.bot) {
            console.log(
              `Adding bot ${userEntity.username || userEntity.id} as admin...`,
            );
            await client.invoke(
              new Api.channels.EditAdmin({
                channel: res.chats[0].id,
                userId: userEntity,
                adminRights: new Api.ChatAdminRights({
                  // Full admin rights
                  changeInfo: true,
                  postMessages: true,
                  editMessages: true,
                  deleteMessages: true,
                  banUsers: true,
                  inviteUsers: true,
                  pinMessages: true,
                  addAdmins: true,
                  anonymous: false,
                  manageCall: true,
                  other: true,
                }),
                rank: "bot",
              }),
            );
            console.log(
              `Successfully added bot ${userEntity.username || userEntity.id}.`,
            );
          } else {
            console.log(
              `Inviting user ${userEntity.username || userEntity.id}...`,
            );
            await client.invoke(
              new Api.channels.InviteToChannel({
                channel: res.chats[0].id,
                users: [userEntity],
              }),
            );
            console.log(
              `Promoting user ${
                userEntity.username || userEntity.id
              } to admin...`,
            );
            await client.invoke(
              new Api.channels.EditAdmin({
                channel: res.chats[0].id,
                userId: userEntity,
                adminRights: new Api.ChatAdminRights({
                  // Full admin rights
                  changeInfo: true,
                  postMessages: true,
                  editMessages: true,
                  deleteMessages: true,
                  banUsers: true,
                  inviteUsers: true,
                  pinMessages: true,
                  addAdmins: true,
                  anonymous: false,
                  manageCall: true,
                  other: true,
                }),
                rank: "admin",
              }),
            );
            console.log(
              `Successfully invited and promoted user ${
                userEntity.username || userEntity.id
              }.`,
            );
          }
        } catch (error) {
          console.error(`Error processing user/bot ${user}:`, error.message);
        }
      }
    }
    const inviteres = await client.invoke(
      new Api.messages.ExportChatInvite({
        peer: res.chats[0].id,
      }),
    );

    return { id: Number(res.chats[0].id), link: inviteres.link };
  } catch (error) {
    console.error("Error in createChannel function:", error);
    // Rethrow to be handled by the caller
    throw error;
  }
}
