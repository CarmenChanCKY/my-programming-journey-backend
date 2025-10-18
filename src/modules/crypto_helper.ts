import { getEnvironmentVar } from "config/env/env";
import crypto from "crypto";

const algo = "aes-256-gcm";
const encryptKey = getEnvironmentVar("CRYPTO_ENCRYPTION_KEY", "");

const encrypt = (text: string) => {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(algo, encryptKey, iv);
  const ciphertext = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    cipher: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
};

const decrypt = (ciphertext: string, ivStr: string, tagStr: string) => {
  const iv = Buffer.from(ivStr, "base64");
  const tag = Buffer.from(tagStr, "base64");
  const decipher = crypto.createDecipheriv(algo, encryptKey, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
};

const generateUUIDStr = () => {
  return crypto.randomUUID().toString();
};

export { encrypt, decrypt, generateUUIDStr };
