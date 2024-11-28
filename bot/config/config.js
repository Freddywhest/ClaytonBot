const _isArray = require("../utils/_isArray");

require("dotenv").config();
let code = [];
if (!process.env.REFERRAL_CODE) {
  code = ["UL3P8qnd"];
} else {
  code = process.env.REFERRAL_CODE.split(",");
}
const settings = {
  API_ID:
    process.env.API_ID && /^\d+$/.test(process.env.API_ID)
      ? parseInt(process.env.API_ID)
      : process.env.API_ID && !/^\d+$/.test(process.env.API_ID)
      ? "N/A"
      : undefined,
  API_HASH: process.env.API_HASH || "",

  MAX_CONCURRENT_ACCOUNT:
    process.env.MAX_CONCURRENT_ACCOUNT &&
    /^\d+$/.test(process.env.MAX_CONCURRENT_ACCOUNT)
      ? parseInt(process.env.MAX_CONCURRENT_ACCOUNT)
      : 2,

  DELAY_BETWEEN_STARTING_BOT:
    process.env.DELAY_BETWEEN_STARTING_BOT &&
    _isArray(process.env.DELAY_BETWEEN_STARTING_BOT)
      ? JSON.parse(process.env.DELAY_BETWEEN_STARTING_BOT)
      : [15, 20],

  DELAY_BETWEEN_TASKS:
    process.env.DELAY_BETWEEN_TASKS && _isArray(process.env.DELAY_BETWEEN_TASKS)
      ? JSON.parse(process.env.DELAY_BETWEEN_TASKS)
      : [5, 10],

  DELAY_BETWEEN_GAME:
    process.env.DELAY_BETWEEN_GAME && _isArray(process.env.DELAY_BETWEEN_GAME)
      ? JSON.parse(process.env.DELAY_BETWEEN_GAME)
      : [5, 10],

  SLEEP_BETWEEN_NON_THREADS:
    process.env.SLEEP_BETWEEN_NON_THREADS &&
    _isArray(process.env.SLEEP_BETWEEN_NON_THREADS)
      ? JSON.parse(process.env.SLEEP_BETWEEN_NON_THREADS)
      : [1800, 2100],

  USE_PROXY_FROM_TXT_FILE: process.env.USE_PROXY_FROM_TXT_FILE
    ? process.env.USE_PROXY_FROM_TXT_FILE.toLowerCase() === "true"
    : false,

  USE_PROXY_FROM_JS_FILE: process.env.USE_PROXY_FROM_JS_FILE
    ? process.env.USE_PROXY_FROM_JS_FILE.toLowerCase() === "true"
    : false,

  AUTO_CREATE_AND_CONNECT_WALLET: process.env.AUTO_CREATE_AND_CONNECT_WALLET
    ? process.env.AUTO_CREATE_AND_CONNECT_WALLET.toLowerCase() === "true"
    : true,

  AUTO_COMPLETE_TASKS: process.env.AUTO_COMPLETE_TASKS
    ? process.env.AUTO_COMPLETE_TASKS.toLowerCase() === "true"
    : true,

  AUTO_PLAY_GAMES: process.env.AUTO_PLAY_GAMES
    ? process.env.AUTO_PLAY_GAMES.toLowerCase() === "true"
    : true,

  CAN_CREATE_SESSION: false,
};

module.exports = settings;
