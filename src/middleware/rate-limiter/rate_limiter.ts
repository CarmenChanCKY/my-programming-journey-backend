import { Express } from "express";
import { rateLimit } from "express-rate-limit";
import { mw, getClientIp } from "request-ip";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { writeErrorLog } from "@/modules/logger";

const rateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000,
  limit: process.env.NODE_ENV === "development" ? 300 : 50,
  headers: true,
  requestPropertyName: "MPJPublicRateLimit",
  keyGenerator: (req, res) => {
    return getClientIp(req) || req.ip;
  },
  handler: (req, res, next, options) => {
    writeErrorLog(JSON.stringify(options));
    res
      .status(options.statusCode)
      .send(getErrorMsg(options.statusCode.toString()));
  },
});

const cmsRateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000,
  limit: process.env.NODE_ENV === "development" ? 300 : 30,
  headers: true,
  requestPropertyName: "MPJCMSRateLimit",
  keyGenerator: (req, res) => {
    return getClientIp(req) || req.ip;
  },
  handler: (req, res, next, options) => {
    writeErrorLog(JSON.stringify(options));
    res
      .status(options.statusCode)
      .send(getErrorMsg(options.statusCode.toString()));
  },
});

const initializeRateLimiter = (app: Express) => {
  app.use(mw());
  app.set("trust proxy", 1);
};

export { initializeRateLimiter, cmsRateLimitMiddleware, rateLimitMiddleware };
