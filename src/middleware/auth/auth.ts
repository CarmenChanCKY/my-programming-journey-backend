import { betterAuth } from "better-auth";
import { dbPool } from "config/database/connect";
import { getEnvironmentVar } from "config/env/env";

const isProduction = getEnvironmentVar("NODE_ENV") === "production";

export const auth = betterAuth({
  database: dbPool,
  basePath: getEnvironmentVar("API_BASE_PATH", "/token-admin"),
  baseURL: getEnvironmentVar("BETTER_AUTH_URL", "http://localhost:3100"),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  trustedOrigins: [
    getEnvironmentVar("CMS_PATH", "http://localhost:3000"),
    getEnvironmentVar("FRONTEND_PATH", "http://localhost:5173"),
  ],
  rateLimit: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      maxAge: 60 * 60 * 24 * 7,
      strategy: "jwe",
    },
  },
  advanced: {
    useSecureCookies: isProduction,
  },
});

export type Session = typeof auth.$Infer.Session;
