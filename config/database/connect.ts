import mysql2 from "mysql2";
import { getEnvironmentVar } from "config/env/env";

let dbPool: mysql2.Pool = mysql2.createPool({
  host: getEnvironmentVar("DB_HOST", "localhost"),
  port: parseInt(getEnvironmentVar("DB_PORT", 3306), 10),
  user: getEnvironmentVar("DB_USERNAME", "root"),
  password: getEnvironmentVar("DB_PASSWORD"),
  database: getEnvironmentVar("DB_DATABASE"),
  dateStrings: true,
});

dbPool.getConnection((err, connection) => {
  if (err) {
    console.error("DB CONNECT FAIL");
    throw err;
  }

  connection.release();
});

export { dbPool };
