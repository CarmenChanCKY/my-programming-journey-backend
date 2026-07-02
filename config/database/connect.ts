import mysql2 from "mysql2/promise";
import { getEnvironmentVar } from "config/env/env";
import { writeConsoleLog, writeErrorLog } from "@/modules/logger";

// connect mysql database

let dbPool: mysql2.Pool = mysql2.createPool({
  host: getEnvironmentVar("DB_HOST", "localhost"),
  port: parseInt(getEnvironmentVar("DB_PORT", 3306), 10),
  user: getEnvironmentVar("DB_USERNAME", "root"),
  password: getEnvironmentVar("DB_PASSWORD"),
  database: getEnvironmentVar("DB_DATABASE"),
  dateStrings: true,
  timezone: "Z",
});

dbPool
  .getConnection()
  .then((connection) => {
    connection.release();
  })
  .catch((error) => {
    writeErrorLog(`MySQL server connection error.\n${JSON.stringify(error)}`);
    writeConsoleLog(
      "error",
      `MySQL server connection error.\n${JSON.stringify(error)}`
    );
    throw error;
  });

const getDBName = (): string => {
  return getEnvironmentVar("DB_DATABASE");
};

export { dbPool, getDBName };
