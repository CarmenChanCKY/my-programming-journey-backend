import express, { Express } from "express";
import { getEnvironmentVar } from "config/env/env";
import { customErrorHandler } from "@/middleware/error-handler/error_handler";
import {
  writeInfoLog,
  writeConsoleLog,
  cmsWriteInfoLog,
} from "@/modules/logger";
import {
  initializeRateLimiter,
  cmsRateLimitMiddleware,
  rateLimitMiddleware,
} from "@/middleware/rate-limiter/rate_limiter";
import { middleware, errorHandler } from "supertokens-node/framework/express";
import { initTokens } from "@/middleware/security-tokens/security_tokens";

import adminRouter from "@/routes/admin";
import postRouter from "@/routes/post";
import searchRouter from "@/routes/search";
import categoriesRouter from "@/routes/categories";
import tagsRouter from "@/routes/tag";

const app: Express = express();
const port = getEnvironmentVar("PORT", 3000);
const helmet = require("helmet");
const cors = require("cors");

// security function
initializeRateLimiter(app);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'","'unsafe-eval'"],
        "img-src": ["'self'", "https://cdn.jsdelivr.net"],
      },
    },
  })
);

const supertokens = initTokens();
app.use(
  cors({
    origin: getEnvironmentVar("AUTH_WEB_DOMAIN", ""),
    allowedHeaders: ["Content-Type", ...supertokens.getAllCORSHeaders()],
    credentials: true,
  })
);
app.use(middleware());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/post", rateLimitMiddleware, postRouter);
app.use("/explore", rateLimitMiddleware, searchRouter);
app.use("/categories", rateLimitMiddleware, categoriesRouter);
app.use("/tag", rateLimitMiddleware, tagsRouter);

// for cms
app.use("/admin", cmsRateLimitMiddleware, adminRouter);

// error handler for supertoken
app.use(errorHandler());
app.use(customErrorHandler);

app.listen(port, () => {
  writeInfoLog(`Start Server at port ${port}`);
  cmsWriteInfoLog(`Start Server at port ${port}`);
  writeConsoleLog("info", `Server is running at http://localhost:${port}`);
});
