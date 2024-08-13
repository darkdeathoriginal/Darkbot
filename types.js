// types.js

/**
 * @typedef {import('telegram').TelegramClient} TelegramClient
 */

/**
 * @typedef {Object} BaseMessage
 * @property {TelegramClient} client
 */

/**
 * @typedef {Object} ModuleConfig
 * @property {string} pattern - The pattern that triggers the module.
 * @property {boolean} fromMe - Indicates if the command is from the bot itself.
 * @property {string} desc - Description of the command.
 * @property {string} use - The category or use case for the module.
 */

/**
 * @typedef {import('./lib/Message') & BaseMessage} Message
 */

/**
 * @typedef {function(ModuleConfig, function( Message, Array): Promise<void>): void} Module
 */