module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    define: { charset: "utf8mb4", dialectOptions: { collate: "utf8mb4_unicode_ci" } },
    dialectOptions: {
      bigNumberStrings: true,
    },
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    define: { charset: "utf8mb4", dialectOptions: { collate: "utf8mb4_unicode_ci" } },
    dialectOptions: {
      bigNumberStrings: true,
    },
  },
};
