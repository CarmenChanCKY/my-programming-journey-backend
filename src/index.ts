import express, { Express, Request, Response } from "express";
import { getEnvironmentVar } from "config/env/env";
const db = require("config/database/connect");

const app: Express = express();
const port = getEnvironmentVar("PORT", 3000);

app.get("/", (req: Request, res: Response) => {
  res.send("Success");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
