import mysql2 from "mysql2/promise";
import { getEnvironmentVar } from "config/env/env";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";

let dbPool: mysql2.Pool = mysql2.createPool({
  host: getEnvironmentVar("DB_HOST", "localhost"),
  port: parseInt(getEnvironmentVar("DB_PORT", 3306), 10),
  user: getEnvironmentVar("DB_USERNAME", "root"),
  password: getEnvironmentVar("DB_PASSWORD"),
  database: getEnvironmentVar("DB_DATABASE"),
  dateStrings: true,
});

dbPool
  .getConnection()
  .then((connection) => {
    connection.release();
  })
  .catch((error) => {
    throw getErrorMsg("502", error);
  });

const getDBName = (): string => {
  return getEnvironmentVar("DB_DATABASE");
};

export { dbPool, getDBName };
