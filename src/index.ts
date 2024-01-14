import express, { Express } from "express";
import { getEnvironmentVar } from "config/env/env";
import {
  errorHandler,
  getErrorMsg,
} from "@/middleware/error-handler/error_handler";
import { rateLimit } from "express-rate-limit";
import { mw, getClientIp } from "request-ip";

const app: Express = express();
const port = getEnvironmentVar("PORT", 3000);

app.use(mw());
app.set("trust proxy", 1);

import adminRouter from "@/routes/admin";
import postRouter from "@/routes/post";
import searchRouter from "@/routes/search";
import categoriesRouter from "@/routes/categories";
import tagsRouter from "@/routes/tag";

const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  headers: true,
  requestPropertyName: "MPJPublicRateLimit",
  keyGenerator: (req, res) => {
    return getClientIp(req) || req.ip;
  },
  handler: (req, res, next, options) => {
    res
      .status(options.statusCode)
      .send(getErrorMsg(options.statusCode.toString()));
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/post", rateLimitMiddleware, postRouter);
app.use("/explore", rateLimitMiddleware, searchRouter);
app.use("/categories", rateLimitMiddleware, categoriesRouter);
app.use("/tag", rateLimitMiddleware, tagsRouter);

app.use("/admin", adminRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
