import dotenv from "dotenv";

dotenv.config({ path: `config/env/.env.${process.env.NODE_ENV || "development"}` });

const getEnvironmentVar = (key: string, defaultVal: any = "") => {
  return process.env[key] || defaultVal;
};

export { getEnvironmentVar };
