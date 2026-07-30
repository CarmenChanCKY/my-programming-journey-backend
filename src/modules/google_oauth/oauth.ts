import { cmsWriteErrorLog, writeConsoleLog } from "@/modules/logger";
import { getEnvironmentVar } from "config/env/env";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { getToken, insertToken } from "./oauth_db";

const clientId = getEnvironmentVar("GOOGLE_API_CLIENT_ID");
const clientSecret = getEnvironmentVar("GOOGLE_API_CLIENT_SECRET");
const redirectUri = getEnvironmentVar("GOOGLE_API_REDIRECT_URLS");
const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

client.on("tokens", async (tokens: any) => {
  try {
    const currentTokenResult = await getToken(clientId);
    // use the refresh token store in db (if tokens.refresh_token does not exists)
    const existingRefreshToken = currentTokenResult.success
      ? currentTokenResult.data.refreshToken
      : "";
    const refreshToken = tokens.refresh_token
      ? tokens.refresh_token
      : existingRefreshToken;

    if (!refreshToken) {
      writeConsoleLog(
        "error",
        "No refresh token available during token refresh event.",
      );
      return;
    }

    // insert token to db
    return insertToken(
      clientId,
      tokens.access_token ?? "",
      refreshToken,
      tokens.scope ?? "",
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

const getDestFolderID = (): string => {
  return getEnvironmentVar("GOOGLE_API_DESTINATION_FOLDER_ID");
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
      tokens.refresh_token ?? "",
      tokens.scope ?? "",
      tokens.token_type ?? "",
      tokens.expiry_date ?? 0
    );
  } catch (error: any) {
    writeConsoleLog("error", `receive google auth callback error.\n${error}`);
    cmsWriteErrorLog(`receive google auth callback error.\n${error}`);
    return { success: false, data: error };
  }
};

const apiSetCredentials = async () => {
  const tokenResult = await getToken(getClientID());

  if (tokenResult.success) {
    setCredentials(tokenResult.data.refreshToken, tokenResult.data.accessToken);
    return { success: true, type: "", data: "" };
  } else {
    return {
      success: false,
      type: "redirect",
      data: { reauthUrl: startGoogleAuth() },
    };
  }
};

const checkIsAuthError = (err: any) => {
  if (err && err.message === "NO_REFRESH_TOKEN" && err.reauthUrl) {
    // reauth required
    return {
      type: "redirect",
      data: {
        error: "REAUTH_REQUIRED",
        reauthUrl: err.reauthUrl,
      },
    };
  }

  // handle invalid_grant or revoked refresh token
  const msg = err?.response?.data || err?.message || String(err);
  if (
    (typeof msg === "object" &&
      (msg.error === "invalid_grant" || msg.error === "unauthorized_client")) ||
    err.message.includes("Request had invalid authentication credentials.")
  ) {
    return {
      type: "redirect",
      data: {
        error: "REAUTH_REQUIRED",
        reauthUrl: startGoogleAuth(),
      },
    };
  }

  return { type: "error", data: err.message || String(err) };
};

export {
  getClientID,
  startGoogleAuth,
  receiveAuthCallback,
  getOauth2Client,
  setCredentials,
  getDestFolderID,
  apiSetCredentials,
  checkIsAuthError,
};
