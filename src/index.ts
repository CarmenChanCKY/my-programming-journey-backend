import express, { Express, Request, Response } from "express";
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
import { verifySession } from "supertokens-node/recipe/session/framework/express";

import postRouter from "@/routes/post";
import searchRouter from "@/routes/search";
import categoriesRouter from "@/routes/categories";
import tagsRouter from "@/routes/tag";
import cmsTagsRouter from "@/routes/cms/tags";
import cmsCategoriesRouter from "@/routes/cms/categories";
import cmsPostRouter from "@/routes/cms/post";
import cmsUploaderRouter from "@/routes/cms/upload";
import { receiveAuthCallback } from "@/modules/google_oauth/oauth";

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
        "script-src": [
          "'self'",
          "https://cdn.jsdelivr.net",
          "'unsafe-inline'",
          "'unsafe-eval'",
        ],
        "img-src": ["'self'", "https://cdn.jsdelivr.net"],
      },
    },
  })
);

// config for supertoken
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
app.use("/cms/tags", cmsRateLimitMiddleware, verifySession(), cmsTagsRouter);
app.use(
  "/cms/categories",
  cmsRateLimitMiddleware,
  verifySession(),
  cmsCategoriesRouter
);

app.use("/cms/post", cmsRateLimitMiddleware, verifySession(), cmsPostRouter);

app.use(
  "/cms/upload",
  cmsRateLimitMiddleware,
  verifySession(),
  cmsUploaderRouter
);

// for google auth callback
app.use(
  getEnvironmentVar("GOOGLE_API_REDIRECT_PATHNAME"),
  async (req: Request, res: Response) => {
    // callback about the auth callback is success / fail
    const handleCallback = await receiveAuthCallback(
      String(req.query.code || "")
    );

    let success = false;
    let message = "";

    if (handleCallback.success) {
      success = true;
      message =
        "Authentication Success. Please close this window and upload again.";
    } else {
      message = `Authentication Fail. Reason: ${handleCallback.data}`;
    }

    const result = `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Authentication Result</title>
        <style>
            html,
            body {
                margin: 0;
                padding: 0;
                height: 100dvh;
            }
            .main {
                max-width: 900px;
                margin: 0 auto;
                height: 100%;
            }
            .main .content {
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
        </style>
    </head>
    <body>
        <div class="main">
            <div class="content">
                <h1>${success ? "Success" : "Fail"}</h1>
                <p>${message}</p>
            </div>
        </div>
    </body>
    </html>`;

    res.send(result);
  }
);

// error handler for supertoken
app.use(errorHandler());
app.use(customErrorHandler);

app.listen(port, () => {
  writeInfoLog(`Start Server at port ${port}`);
  cmsWriteInfoLog(`Start Server at port ${port}`);
  writeConsoleLog("info", `Server is running at http://localhost:${port}`);
});
