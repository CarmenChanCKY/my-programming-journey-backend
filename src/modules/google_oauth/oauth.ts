import express, { NextFunction } from "express";
import { encrypt, decrypt } from "@/modules/crypto_helper";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { cmsWriteErrorLog, writeConsoleLog } from "@/modules/logger";
import { getEnvironmentVar } from "config/env/env";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { insertToken } from "./oauth_db";

const getScopes = () => {
  return ["https://www.googleapis.com/auth/drive.file"];
};

const getClientID = () => {
  return getEnvironmentVar("GOOGLE_API_CLIENT_ID");
};

const getOauth2Client = (): OAuth2Client => {
  const clientId = getClientID();
  const clientSecret = getEnvironmentVar("GOOGLE_API_CLIENT_SECRET");
  const redirectUri = getEnvironmentVar("GOOGLE_API_REDIRECT_URLS");
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

const startGoogleAuth = () => {
  const client = getOauth2Client();
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

    const client = getOauth2Client();
    const { tokens } = await client.getToken(code);

    // insert token to db
    return insertToken(
      getClientID(),
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

export { getClientID, startGoogleAuth, receiveAuthCallback };
