const { default: axios } = require("axios");
const logger = require("../utils/logger");
const headers = require("./header");
const settings = require("../config/config");
const app = require("../config/app");
const user_agents = require("../config/userAgents");
const fs = require("fs");
const sleep = require("../utils/sleep");
const ApiRequest = require("./api");
const _ = require("lodash");
const path = require("path");
const { HttpsProxyAgent } = require("https-proxy-agent");
const parser = require("../utils/parser");
const { CW, sample } = require("../utils/helper");
const { checkUrls } = require("../utils/assetsChecker");

class NonSessionTapper {
  constructor(query_id, query_name) {
    this.bot_name = "clayton";
    this.session_name = query_name;
    this.query_id = query_id;
    this.API_URL = app.apiUrl;
    this.session_user_agents = this.#load_session_data();
    this.headers = { ...headers, "user-agent": this.#get_user_agent() };
    this.api = new ApiRequest(this.session_name, this.bot_name);
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
      return this.query_id;
    } catch (error) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error during Authorization: ${error}`
      );
      throw error;
    } finally {
      await sleep(1);
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🚀 Starting session...`
      );
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
module.exports = NonSessionTapper;
