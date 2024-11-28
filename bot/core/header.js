const app = require("../config/app");

const headers = {
  "sec-ch-ua-platform": '"Android"',
  "user-agent":
    "Mozilla/5.0 (Linux; Android 13; SM-G925F Build/TQ3A.230901.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.107 Mobile Safari/537.36",
  accept: "application/json, text/plain, */*",
  "sec-ch-ua":
    '"Chromium";v="130", "Android WebView";v="130", "Not?A_Brand";v="99"',
  "sec-ch-ua-mobile": "?1",
  origin: "https://tonclayton.fun",
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "cors",
  "sec-fetch-dest": "empty",
  referer: "https://tonclayton.fun/",
  "accept-encoding": "gzip, deflate, br, zstd",
  "accept-language": "en,en-US;q=0.9",
  priority: "u=1, i",
};

module.exports = headers;
