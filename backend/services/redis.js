const Redis = require("ioredis");

let client;

function getRedis() {
  if (!client) {
    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL environment variable is not set");
    }
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    client.on("error", (err) => {
      console.error("Redis error:", err.message);
    });
  }
  return client;
}

const SESSION_PREFIX = "session:";

function sessionKey(walletAddress) {
  return `${SESSION_PREFIX}${walletAddress.toLowerCase()}`;
}

async function cacheSession(walletAddress, ttlSeconds) {
  await getRedis().set(sessionKey(walletAddress), "1", "EX", ttlSeconds);
}

async function sessionExists(walletAddress) {
  const result = await getRedis().get(sessionKey(walletAddress));
  return result !== null;
}

async function deleteSession(walletAddress) {
  await getRedis().del(sessionKey(walletAddress));
}

module.exports = { cacheSession, sessionExists, deleteSession };
