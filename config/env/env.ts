import dotenv from "dotenv";

dotenv.config({ path: `config/env/.env.${process.env.NODE_ENV}` });

const getCurrentEnvironment = () => {
  return process.env.NODE_ENV;
};

const getEnvironmentVar = (key: string, defaultVal: any = "") => {
  return process.env[key] || defaultVal;
};

export { getCurrentEnvironment, getEnvironmentVar };
