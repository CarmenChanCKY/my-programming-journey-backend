import express, { Express, Request, Response } from "express";
import 'reflect-metadata';
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
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/middleware/auth/auth";
import { requireAuth } from "@/middleware/auth/require_auth";

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

const allowedOrigins = [
  getEnvironmentVar("FRONTEND_PATH", ""),
  getEnvironmentVar("CMS_PATH", ""),
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.all("/token-admin/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/post", rateLimitMiddleware, postRouter);
app.use("/explore", rateLimitMiddleware, searchRouter);
app.use("/categories", rateLimitMiddleware, categoriesRouter);
app.use("/tag", rateLimitMiddleware, tagsRouter);

// for cms
app.use("/cms/tags", cmsRateLimitMiddleware, requireAuth, cmsTagsRouter);
app.use(
  "/cms/categories",
  cmsRateLimitMiddleware,
  requireAuth,
  cmsCategoriesRouter
);

app.use("/cms/post", cmsRateLimitMiddleware, requireAuth, cmsPostRouter);

app.use(
  "/cms/upload",
  cmsRateLimitMiddleware,
  requireAuth,
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

app.use(customErrorHandler);

app.listen(port, () => {
  writeInfoLog(`Start Server at port ${port}`);
  cmsWriteInfoLog(`Start Server at port ${port}`);
  writeConsoleLog("info", `Server is running at http://localhost:${port}`);
});
