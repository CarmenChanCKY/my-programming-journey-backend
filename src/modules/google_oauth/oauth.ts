import { cmsWriteErrorLog, writeConsoleLog } from "@/modules/logger";
import { getEnvironmentVar } from "config/env/env";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { insertToken } from "./oauth_db";

const clientId = getEnvironmentVar("GOOGLE_API_CLIENT_ID");
const clientSecret = getEnvironmentVar("GOOGLE_API_CLIENT_SECRET");
const redirectUri = getEnvironmentVar("GOOGLE_API_REDIRECT_URLS");
const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

client.on("tokens", async (tokens: any) => {
  console.log("tokens: " + tokens);

  try {
    // insert token to db
    return insertToken(
      clientId,
      tokens.access_token ?? "",
      tokens.scope ?? "",
      tokens.refresh_token ?? "",
      tokens.token_type ?? "",
      tokens.expiry_date ?? 0
    );
  } catch (e) {
    writeConsoleLog(
      "error",
      `Failed to persist refreshed tokens.\n${JSON.stringify(e)}`
    );
    cmsWriteErrorLog(
      `Failed to persist refreshed tokens.\n${JSON.stringify(e)}`
    );
  }
});

const getScopes = () => {
  return ["https://www.googleapis.com/auth/drive.file"];
};

const getClientID = () => {
  return clientId;
};

const getOauth2Client = (): OAuth2Client => {
  return client;
};

const setCredentials = (refreshToken: string, accessToken: string) => {
  try {
    client.setCredentials({
      refresh_token: refreshToken,
      access_token: accessToken,
    });
  } catch (err) {
    console.log("set token error");
    console.log(err);
  }
};

const startGoogleAuth = () => {
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: getScopes(),
  });
};

const receiveAuthCallback = async (
  code: string
): Promise<{ success: boolean; data: any }> => {
  try {
    if (!code) {
      writeConsoleLog("error", `receive google auth callback: missing code`);
      cmsWriteErrorLog(`receive google auth callback: missing code`);
      return { success: false, data: "missing code" };
    }

    const { tokens } = await client.getToken(code);

    // insert token to db
    return insertToken(
      clientId,
      tokens.access_token ?? "",
      tokens.scope ?? "",
      tokens.refresh_token ?? "",
      tokens.token_type ?? "",
      tokens.expiry_date ?? 0
    );
  } catch (error: any) {
    writeConsoleLog("error", `receive google auth callback error.\n${error}`);
    cmsWriteErrorLog(`receive google auth callback error.\n${error}`);
    return { success: false, data: error };
  }
};

export {
  getClientID,
  startGoogleAuth,
  receiveAuthCallback,
  getOauth2Client,
  setCredentials,
};
