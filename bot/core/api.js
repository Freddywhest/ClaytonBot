const app = require("../config/app");
const logger = require("../utils/logger");
const sleep = require("../utils/sleep");
const _ = require("lodash");
const zstd = require("@mongodb-js/zstd");
const { responseData } = require("../utils/helper");

class ApiRequest {
  constructor(session_name, bot_name) {
    this.session_name = session_name;
    this.bot_name = bot_name;
  }

  async get_user_data(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/aT83M535-617h-5deb-a17b-6a335a67ffd5/user/authorization`,
        undefined,
        {
          responseType: "arraybuffer",
        }
      );
      return await responseData(response.data);
    } catch (error) {
      if (error?.response?.status > 499) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Server Error while <b>getting user data:</b>: ${error.message}`
        );
        return null;
      }

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting user data:</b> ${error?.response?.data?.message}`
        );
        return null;
      }

      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting user data:</b>: ${error.message}`
      );
      return null;
    }
  }

  async save_user(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/aT83M535-617h-5deb-a17b-6a335a67ffd5/user/save-user`,
        undefined,
        {
          responseType: "arraybuffer",
        }
      );
      return await responseData(response.data);
    } catch (error) {
      if (error?.response?.status == 404) {
        return;
      }

      if (error?.response?.status > 499) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Server Error while <b>saving user:</b>: ${error.message}`
        );
        return null;
      }

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>saving user:</b> ${error?.response?.data?.message}`
        );
        return null;
      }

      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>saving user</b>: ${error.message}`
      );
      return null;
    }
  }

  async daily_claim(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/aT83M535-617h-5deb-a17b-6a335a67ffd5/user/daily-claim`,
        undefined,
        {
          responseType: "arraybuffer",
        }
      );
      return await responseData(response.data);
    } catch (error) {
      if (error?.response?.status == 400) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ${error?.response?.data?.error}`
        );
        return;
      }

      if (error?.response?.status > 499) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Server Error while <b>daily claim:</b>: ${error.message}`
        );
        return null;
      }

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>daily claim:</b> ${error?.response?.data?.message}`
        );
        return null;
      }

      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>daily claim</b>: ${error.message}`
      );
      return null;
    }
  }

  async validate_query_id(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/aT83M535-617h-5deb-a17b-6a335a67ffd5/user/authorization`
      );

      return true;
    } catch (error) {
      if (
        error?.response?.data?.error?.toLowerCase()?.includes("invalid") ||
        error?.response?.data?.error?.toLowerCase()?.includes("expired")
      ) {
        return false;
      }

      throw error;
    }
  }

  async super_tasks(http_client) {
    try {
      const response = await http_client.get(
        `${app.apiUrl}/aT83M535-617h-5deb-a17b-6a335a67ffd5/tasks/super-tasks`,
        {
          responseType: "arraybuffer",
        }
      );
      return await responseData(response.data);
    } catch (error) {
      if (error?.response?.status > 499) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Server Error while <b>getting super tasks:</b>: ${error.message}`
        );
        return null;
      }

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting super tasks:</b> ${error?.response?.data?.message}`
        );
        return null;
      }

      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting super tasks:</b>: ${error.message}`
      );
      return null;
    }
  }

  async complete_super_tasks(http_client, task_id) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/aT83M535-617h-5deb-a17b-6a335a67ffd5/tasks/complete`,
        JSON.stringify({ task_id }),
        {
          responseType: "arraybuffer",
        }
      );
      return await responseData(response.data);
    } catch (error) {
      if (error?.response?.status > 499) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Server Error while <b>completing task:</b>: ${error.message}`
        );
        return null;
      }

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>completing task:</b> ${error?.response?.data?.message}`
        );
        return null;
      }

      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>completing task:</b>: ${error.message}`
      );
      return null;
    }
  }

  async claim_super_tasks(http_client, task_id) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/aT83M535-617h-5deb-a17b-6a335a67ffd5/tasks/claim`,
        JSON.stringify({ task_id }),
        {
          responseType: "arraybuffer",
        }
      );
      return await responseData(response.data);
    } catch (error) {
      if (error?.response?.status > 499) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Server Error while <b>claiming task:</b>: ${error.message}`
        );
        return null;
      }

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming task:</b> ${error?.response?.data?.message}`
        );
        return null;
      }

      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming task:</b>: ${error.message}`
      );
      return null;
    }
  }

  async link_wallet(http_client, wallet) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/aT83M535-617h-5deb-a17b-6a335a67ffd5/user/wallet`,
        JSON.stringify({ wallet }),
        {
          responseType: "arraybuffer",
        }
      );
      return await responseData(response.data);
    } catch (error) {
      if (error?.response?.status > 499) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Server Error while <b>linking wallet:</b>: ${error.message}`
        );
        return null;
      }

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>linking wallet:</b> ${error?.response?.data?.message}`
        );
        return null;
      }

      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>linking wallet:</b>: ${error.message}`
      );
      return null;
    }
  }

  async end_game(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/clay/end-game`,
        JSON.stringify(data)
      );

      return response.data;
    } catch (error) {
      if (error?.response?.status > 499) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Server Error while <b>ending game:</b>: ${error.message}`
        );
        return null;
      }

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>ending game:</b> ${error?.response?.data?.message}`
        );
        return null;
      }

      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>ending game:</b>: ${error.message}`
      );
      return null;
    }
  }

  async start_game(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/clay/start-game`,
        JSON.stringify({})
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status > 499) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Server Error while <b>starting game:</b>: ${error.message}`
        );
        return null;
      }

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>starting game:</b> ${error?.response?.data?.message}`
        );
        return null;
      }

      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>starting game:</b>: ${error.message}`
      );
      return null;
    }
  }
}

module.exports = ApiRequest;
