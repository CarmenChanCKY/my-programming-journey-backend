import fs from "fs";
import dotenv from "dotenv";

const envFilePath = `config/env/.env.${process.env.NODE_ENV || "development"}`;

if (
  (!process.env.DB_HOST || process.env.NODE_ENV === "development") &&
  fs.existsSync(envFilePath)
) {
  dotenv.config({ path: envFilePath });
}

const getEnvironmentVar = (key: string, defaultVal: any = "") => {
  return process.env[key] || defaultVal;
};

export { getEnvironmentVar };
