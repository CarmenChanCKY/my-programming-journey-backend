import crypto from "crypto";
import { getEnvironmentVar } from "config/env/env";
import jwt from "jsonwebtoken";

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

const generateJWTToken = (data: Object): string => {
  return jwt.sign(data, getEnvironmentVar("JWT_SECRET"), {
    expiresIn: "2hours",
  });
};

export { generateSalt, hashPassword, generateJWTToken };
