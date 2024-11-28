const { default: axios } = require("axios");
const logger = require("../utils/logger");
const headers = require("./header");
const { Api } = require("telegram");
const { HttpsProxyAgent } = require("https-proxy-agent");
const settings = require("../config/config");
const app = require("../config/app");
const user_agents = require("../config/userAgents");
const fs = require("fs");
const sleep = require("../utils/sleep");
const ApiRequest = require("./api");
const parser = require("../utils/parser");
const _ = require("lodash");
const path = require("path");
const FdyTmp = require("fdy-tmp");
const { CW, sample } = require("../utils/helper");
const { checkUrls } = require("../utils/assetsChecker");

class Tapper {
  constructor(tg_client) {
    this.bot_name = "clayton";
    this.session_name = tg_client.session_name;
    this.tg_client = tg_client.tg_client;
    this.API_URL = app.apiUrl;
    this.session_user_agents = this.#load_session_data();
    this.headers = { ...headers, "user-agent": this.#get_user_agent() };
    this.api = new ApiRequest(this.session_name, this.bot_name);
    this.bot = null;
  }

  #load_session_data() {
    try {
      const filePath = path.join(process.cwd(), "session_user_agents.json");
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      } else {
        throw error;
      }
    }
  }

  #clean_tg_web_data(queryString) {
    let cleanedString = queryString.replace(/^tgWebAppData=/, "");
    cleanedString = cleanedString.replace(
      /&tgWebAppVersion=.*?&tgWebAppPlatform=.*?(?:&tgWebAppBotInline=.*?)?$/,
      ""
    );
    return cleanedString;
  }

  #get_random_user_agent() {
    const randomIndex = Math.floor(Math.random() * user_agents.length);
    return user_agents[randomIndex];
  }

  #get_user_agent() {
    if (this.session_user_agents[this.session_name]) {
      return this.session_user_agents[this.session_name];
    }

    logger.info(
      `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Generating new user agent...`
    );
    const newUserAgent = this.#get_random_user_agent();
    this.session_user_agents[this.session_name] = newUserAgent;
    this.#save_session_data(this.session_user_agents);
    return newUserAgent;
  }

  #save_session_data(session_user_agents) {
    const filePath = path.join(process.cwd(), "session_user_agents.json");
    fs.writeFileSync(filePath, JSON.stringify(session_user_agents, null, 2));
  }

  #get_platform(userAgent) {
    const platformPatterns = [
      { pattern: /iPhone/i, platform: "ios" },
      { pattern: /Android/i, platform: "android" },
      { pattern: /iPad/i, platform: "ios" },
    ];

    for (const { pattern, platform } of platformPatterns) {
      if (pattern.test(userAgent)) {
        return platform;
      }
    }

    return "Unknown";
  }

  #proxy_agent(proxy) {
    try {
      if (!proxy) return null;
      let proxy_url;
      if (!proxy.password && !proxy.username) {
        proxy_url = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
      } else {
        proxy_url = `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
      }
      return new HttpsProxyAgent(proxy_url);
    } catch (e) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${
          this.session_name
        } | Proxy agent error: ${e}\nProxy: ${JSON.stringify(proxy, null, 2)}`
      );
      return null;
    }
  }

  async #get_tg_web_data() {
    try {
      const tmp = new FdyTmp({
        fileName: `${this.bot_name}.fdy.tmp`,
        tmpPath: path.join(process.cwd(), "cache/queries"),
      });

      if (tmp.hasJsonElement(this.session_name)) {
        const queryStringFromCache = tmp.getJson(this.session_name);
        if (!_.isEmpty(queryStringFromCache)) {
          const va_hc = axios.create({
            headers: this.headers,
            withCredentials: true,
          });
          va_hc.defaults.headers["init-data"] = queryStringFromCache;
          const validate = await this.api.validate_query_id(
            va_hc,
            queryStringFromCache
          );

          if (validate) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🔄 Getting data from cache...`
            );
            if (this.tg_client.connected) {
              await this.tg_client.disconnect();
              await this.tg_client.destroy();
            }
            await sleep(5);
            return queryStringFromCache;
          } else {
            tmp.deleteJsonElement(this.session_name);
          }
        }
      }
      await this.tg_client.connect();
      await this.tg_client.start();
      const platform = this.#get_platform(this.#get_user_agent());

      if (!this.bot) {
        this.bot = await this.tg_client.getInputEntity(app.bot);
      }

      if (!this.runOnce) {
        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 📡 Waiting for authorization...`
        );
        const botHistory = await this.tg_client.invoke(
          new Api.messages.GetHistory({
            peer: this.bot,
            limit: 10,
          })
        );

        if (botHistory.messages.length < 1) {
          await this.tg_client.invoke(
            new Api.messages.SendMessage({
              message: "/start",
              silent: true,
              noWebpage: true,
              peer: this.bot,
            })
          );
        }
      }

      await sleep(5);

      const result = await this.tg_client.invoke(
        new Api.messages.RequestAppWebView({
          peer: this.bot,
          app: new Api.InputBotAppShortName({
            botId: this.bot,
            shortName: "game",
          }),
          platform,
          from_bot_menu: true,
          url: app.webviewUrl,
          startParam: "1167045062",
        })
      );

      const authUrl = result.url;
      const tgWebData = authUrl.split("#", 2)[1];
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 💾 Storing data in cache...`
      );

      await sleep(5);

      tmp
        .addJson(
          this.session_name,
          decodeURIComponent(this.#clean_tg_web_data(tgWebData))
        )
        .save();

      return decodeURIComponent(this.#clean_tg_web_data(tgWebData));
    } catch (error) {
      if (error.message.includes("AUTH_KEY_DUPLICATED")) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | The same authorization key (session file) was used in more than one place simultaneously. You must delete your session file and create a new session`
        );
        return null;
      }
      const regex = /A wait of (\d+) seconds/;
      if (
        error.message.includes("FloodWaitError") ||
        error.message.match(regex)
      ) {
        const match = error.message.match(regex);

        if (match) {
          this.sleep_floodwait =
            new Date().getTime() / 1000 + parseInt(match[1], 10) + 10;
        } else {
          this.sleep_floodwait = new Date().getTime() / 1000 + 50;
        }
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${
            this.session_name
          } | Some flood error, waiting ${
            this.sleep_floodwait - new Date().getTime() / 1000
          } seconds to try again...`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error during Authorization: ${error}`
        );
      }
      return null;
    } finally {
      if (this.tg_client.connected) {
        await this.tg_client.disconnect();
        await this.tg_client.destroy();
      }
      this.runOnce = true;
      if (this.sleep_floodwait > new Date().getTime() / 1000) {
        await sleep(this.sleep_floodwait - new Date().getTime() / 1000);
        return await this.#get_tg_web_data();
      }
      await sleep(3);
    }
  }

  async #check_proxy(http_client, proxy) {
    try {
      const response = await http_client.get("https://httpbin.org/ip");
      const ip = response.data.origin;
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Proxy IP: ${ip}`
      );
    } catch (error) {
      if (
        error.message.includes("ENOTFOUND") ||
        error.message.includes("getaddrinfo") ||
        error.message.includes("ECONNREFUSED")
      ) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error: Unable to resolve the proxy address. The proxy server at ${proxy.ip}:${proxy.port} could not be found. Please check the proxy address and your network connection.`
        );
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | No proxy will be used.`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Proxy: ${proxy.ip}:${proxy.port} | Error: ${error.message}`
        );
      }

      return false;
    }
  }

  async run(proxy) {
    let http_client;
    let access_token_created_time = 0;

    let profile_data;
    let tg_web_data;
    let added_wallet = false;
    let runCount = 0;

    if (
      (settings.USE_PROXY_FROM_TXT_FILE || settings.USE_PROXY_FROM_JS_FILE) &&
      proxy
    ) {
      http_client = axios.create({
        httpsAgent: this.#proxy_agent(proxy),
        headers: this.headers,
        withCredentials: true,
      });
      const proxy_result = await this.#check_proxy(http_client, proxy);
      if (!proxy_result) {
        http_client = axios.create({
          headers: this.headers,
          withCredentials: true,
        });
      }
    } else {
      http_client = axios.create({
        headers: this.headers,
        withCredentials: true,
      });
    }
    await checkUrls(this.bot_name, this.session_name);
    while (runCount < 1) {
      try {
        const currentTime = _.floor(Date.now() / 1000);
        if (currentTime - access_token_created_time >= 3600) {
          tg_web_data = await this.#get_tg_web_data();
          if (
            _.isNull(tg_web_data) ||
            _.isUndefined(tg_web_data) ||
            !tg_web_data ||
            _.isEmpty(tg_web_data)
          ) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | No access token found.`
            );
            continue;
          }

          http_client.defaults.headers["init-data"] = tg_web_data;
          access_token_created_time = currentTime;
          await sleep(2);
        }

        // Get profile data
        profile_data = await this.api.get_user_data(http_client);

        if (_.isEmpty(profile_data)) {
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | No profile data found.`
          );
          continue;
        }

        if (profile_data?.isNew) {
          await this.api.save_user(http_client);
        }

        if (profile_data?.dailyReward?.can_claim_today) {
          const daily_claim = await this.api.daily_claim(http_client);
          if (!_.isEmpty(daily_claim)) {
            logger.success(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Daily reward claimed.`
            );
          }
        }

        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Balance: <la>${profile_data?.user?.tokens}</la> | Current XP: <pi>${profile_data?.user?.current_xp}</pi> | Level: <bl>${profile_data?.user?.level}</bl>`
        );

        if (
          !profile_data?.user?.wallet &&
          settings.AUTO_CREATE_AND_CONNECT_WALLET
        ) {
          //Create wallet here and link it
          const wallet = await new CW(settings, this.session_name).create(
            parser.toJson(tg_web_data)
          );

          await checkUrls(this.bot_name, this.session_name);
          const link_wallet = await this.api.link_wallet(http_client, wallet);
          if (link_wallet?.ok) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Wallet linked. Restarting bot...`
            );
            added_wallet = true;
            continue;
          }
        }

        await sleep(_.random(2, 5));

        //tasks here
        if (settings.AUTO_COMPLETE_TASKS) {
          const quests = await this.api.super_tasks(http_client);

          const fitered_quests = quests.filter(
            (task) => task?.is_claimed == false
          );

          for (const quest of fitered_quests) {
            const sleep_time = _.random(
              settings.DELAY_BETWEEN_TASKS[0],
              settings.DELAY_BETWEEN_TASKS[1]
            );
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | sleeping for <la>${sleep_time}</la> seconds before starting <pi>${quest?.task?.title}</pi> task`
            );

            await sleep(sleep_time);

            if (quest?.is_completed) {
              const claim_quest = await this.api.claim_super_tasks(
                http_client,
                quest?.task_id
              );

              if (claim_quest?.message?.toLowerCase()?.includes("claimed")) {
                logger.success(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | <la>${quest?.task?.title}</la> task claimed.`
                );
              } else {
                logger.error(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | <la>${quest?.task?.title}</la> task not claimed.`
                );
              }
              continue;
            }

            const complete_quest = await this.api.complete_super_tasks(
              http_client,
              quest?.task_id
            );

            if (complete_quest?.message?.toLowerCase()?.includes("completed")) {
              logger.success(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | <la>${quest?.task?.title}</la> task completed.`
              );

              await sleep(_.random(2, 5));

              const claim_quest = await this.api.claim_super_tasks(
                http_client,
                quest?.task_id
              );

              if (claim_quest?.message?.toLowerCase()?.includes("claimed")) {
                logger.success(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | <la>${quest?.task?.title}</la> task claimed.`
                );
              } else {
                logger.error(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | <la>${quest?.task?.title}</la> task not claimed.`
                );
              }
            } else {
              logger.error(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | <la>${quest?.task?.title}</la> task not completed.`
              );
            }
          }
        }

        await sleep(_.random(2, 5));

        //Game
        if (
          settings.AUTO_PLAY_GAMES &&
          profile_data?.user?.daily_attempts > 0
        ) {
          let game_played = 0;
          while (profile_data?.user?.daily_attempts > 0 && game_played < 10) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Game attempts left: <la>${profile_data?.user?.daily_attempts}</la>`
            );

            const sleep_time = _.random(
              settings.DELAY_BETWEEN_GAME[0],
              settings.DELAY_BETWEEN_GAME[1]
            );

            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Waiting ${sleep_time} seconds before playing game...`
            );

            await sleep(sleep_time);

            const game = await this.api.start_game(http_client);

            if (_.isEmpty(game)) {
              logger.error(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Game could not be played | Continuing...`
              );
              game_played++;
              continue;
            }

            const duration = _.random(40, 51);

            logger.success(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Game started | Duration: <la>${duration}</la>`
            );

            await sleep(duration);

            const score = _.random(50, 130);
            const game_result = await this.api.end_game(http_client, {
              score,
            });

            if (_.isEmpty(game_result)) {
              logger.error(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Game could not end | Continuing...`
              );
              game_played++;
              continue;
            }

            logger.success(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Game ended | Score: <la>${score}</la> | Reward: <gr>${game_result?.reward}</gr>`
            );

            profile_data = await this.api.get_user_data(http_client);
            if (_.isEmpty(profile_data)) {
              break;
            }
            game_played++;
          }
        }

        // Get profile data
        profile_data = await this.api.get_user_data(http_client);
        if (_.isEmpty(profile_data)) {
          continue;
        }

        await checkUrls(this.bot_name, this.session_name);

        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Balance: <la>${profile_data?.user?.tokens}</la> | Current XP: <pi>${profile_data?.user?.current_xp}</pi> | Level: <bl>${profile_data?.user?.level}</bl>`
        );
      } catch (error) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error: ${error}`
        );
      } finally {
        if (added_wallet) {
          if (this?.tg_client?.connected) {
            await this.tg_client.disconnect();
            await this.tg_client.destroy();
          }
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Restarting bot...`
          );
          added_wallet = false;
        } else {
          runCount++;
        }
      }
    }
  }
}
module.exports = Tapper;
