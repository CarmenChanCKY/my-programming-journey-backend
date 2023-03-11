import express, { Express, NextFunction, Request, Response } from "express";
import { getEnvironmentVar } from "config/env/env";
import { errorHandler } from "@/middleware/error-handler/error_handler";
const db = require("config/database/connect");

const app: Express = express();
const port = getEnvironmentVar("PORT", 3000);

import adminRouter from "@/routes/admin";

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/admin", adminRouter);

// custom error handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
