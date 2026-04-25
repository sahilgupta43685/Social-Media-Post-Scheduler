const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

let cachedKeyring = null;

const parseKey = (rawKey, sourceLabel) => {
  const key = Buffer.from(rawKey, "base64");
  if (key.length !== 32) {
    throw new Error(`${sourceLabel} must be base64 for exactly 32 bytes`);
  }
  return key;
};

const loadKeyring = () => {
  if (cachedKeyring) return cachedKeyring;

  const keyringEnv = process.env.TOKEN_ENCRYPTION_KEYS;
  const singleKeyEnv = process.env.TOKEN_ENCRYPTION_KEY;

  let keys = [];
  if (keyringEnv) {
    keys = keyringEnv
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry, index) => ({
        id: `k${index}`,
        key: parseKey(entry, `TOKEN_ENCRYPTION_KEYS[${index}]`)
      }));
  } else if (singleKeyEnv) {
    keys = [{ id: "k0", key: parseKey(singleKeyEnv, "TOKEN_ENCRYPTION_KEY") }];
  } else {
    throw new Error("Missing TOKEN_ENCRYPTION_KEY or TOKEN_ENCRYPTION_KEYS in .env");
  }

  cachedKeyring = keys;
  return cachedKeyring;
};

const getActiveKeyInfo = () => loadKeyring()[0];

const encryptToken = (plainText) => {
  const activeKey = getActiveKeyInfo();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, activeKey.key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encryptedValue: `${activeKey.id}$${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`,
    keyId: activeKey.id
  };
};

const decryptToken = (packed) => {
  const keyring = loadKeyring();
  const raw = packed || "";
  const match = raw.match(/^(k\d+)\$(.+)$/);

  let encodedPayload = raw;
  let keyCandidates = keyring;

  if (match) {
    const [, keyId, payload] = match;
    encodedPayload = payload;
    const selected = keyring.find((entry) => entry.id === keyId);
    if (!selected) {
      throw new Error(`No matching encryption key found for key id ${keyId}`);
    }
    keyCandidates = [selected];
  }

  const [ivB64, tagB64, cipherB64] = encodedPayload.split(".");
  if (!ivB64 || !tagB64 || !cipherB64) {
    throw new Error("Invalid encrypted token format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const cipherText = Buffer.from(cipherB64, "base64");

  let lastError = null;
  for (const candidate of keyCandidates) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, candidate.key, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
      return decrypted.toString("utf8");
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Failed to decrypt token with configured keys: ${lastError?.message || "unknown error"}`);
};

module.exports = {
  encryptToken,
  decryptToken,
  getActiveKeyId: () => getActiveKeyInfo().id
};
