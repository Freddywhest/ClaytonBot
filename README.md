> [<img src="https://img.shields.io/badge/Telegram-%40Me-orange">](https://t.me/roddyfred)

# Use Node.Js 18 or greater

## Functionality

| Functional                                                    | Supported |
| ------------------------------------------------------------- | :-------: |
| Auto creating wallet and linking                              |    ✅     |
| Auto completing quests                                        |    ✅     |
| Multithreading                                                |    ✅     |
| Binding a proxy to a session                                  |    ✅     |
| Auto-purchase of items if you have coins (multitap, attempts) |    ✅     |
| Binding a proxy to a session/query_id                         |    ✅     |
| Random sleep time between clicks                              |    ✅     |

## [How to add query id](https://github.com/Freddywhest/RockyRabbitBot/blob/main/AddQueryId.md)

## [Settings](https://github.com/FreddyWhest/ClaytonBot/blob/main/.env-example)

| Settings                           | Description                                                                |
| ---------------------------------- | -------------------------------------------------------------------------- |
| **API_ID / API_HASH**              | Platform data from which to launch a Telegram session (stock - Android)    |
| **WORD_PHRASE_LENGTH**             | The length of key phrase to generate for thr wallet (12 or 24)             |
| **AUTO_CREATE_AND_CONNECT_WALLET** | Whether the bot should auto create and connect wallet (True / False)       |
| **SLEEP_BETWEEN_NON_THREADS**      | Sleep between threads (eg. [20, 30])                                       |
| **AUTO_COMPLETE_TASKS**            | Whether the bot should complete tasks (True / False)                       |
| **DELAY_BETWEEN_TASKS**            | Delay between tasks in seconds (eg. [20, 30])                              |
| **DELAY_BETWEEN_GAME**             | Delay between game in seconds (eg. [20, 30])                               |
| **DELAY_BETWEEN_STARTING_BOT**     | Delay between starting in seconds (eg. [20, 30])                           |
| **USE_PROXY_FROM_JS_FILE**         | Whether to use proxy from the `bot/config/proxies.js` file (True / False)  |
| **USE_PROXY_FROM_TXT_FILE**        | Whether to use proxy from the `bot/config/proxies.txt` file (True / False) |

### More configurations [Click Here](/README-UPDATE.md)

## Installation

You can download [**Repository**](https://github.com/FreddyWhest/ClaytonBot) by cloning it to your system and installing the necessary dependencies:

```shell
~ >>> git clone https://github.com/FreddyWhest/ClaytonBot.git
~ >>> cd ClaytonBot

#Linux and MocOS
~/ClaytonBot >>> chmod +x check_node.sh
~/ClaytonBot >>> ./check_node.sh

OR

~/ClaytonBot >>> npm install
~/ClaytonBot >>> cp .env-example .env
~/ClaytonBot >>> nano .env # Here you must specify your API_ID and API_HASH , the rest is taken by default
~/ClaytonBot >>> node index.js

#Windows
1. Double click on INSTALL.bat in ClaytonBot directory to install the dependencies
2. Double click on START.bat in ClaytonBot directory to start the bot

OR

~/ClaytonBot >>> npm install
~/ClaytonBot >>> cp .env-example .env
~/ClaytonBot >>> # Specify your API_ID and API_HASH, the rest is taken by default
~/ClaytonBot >>> node index.js
```

Also for quick launch you can use arguments, for example:

```shell
~/ClaytonBot >>> node index.js --action=1

OR

~/ClaytonBot >>> node index.js --action=2

#1 - Create session
#2 - Run clicker
```
