import crypto from "crypto";
import { getEnvironmentVar } from "config/env/env";

const generateSalt = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

const hashPassword = (plainPW: string, salt: string): string => {
  const iteration = parseInt(getEnvironmentVar("HASH_ITERATION"), 10);
  const keylen = parseInt(getEnvironmentVar("HASH_KEYLEN"), 10);
  const digest = getEnvironmentVar("HASH_DIGEST");

  return crypto
    .pbkdf2Sync(plainPW, salt, iteration, keylen, digest)
    .toString(`hex`);
};

export { generateSalt, hashPassword };
