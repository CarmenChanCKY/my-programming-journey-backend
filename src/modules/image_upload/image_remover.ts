// TODO: https://developers.google.com/workspace/drive/api/reference/rest/v2/files/trash

import { google } from "googleapis";
import {
  getDestFolderID,
  getOauth2Client,
  startGoogleAuth,
} from "../google_oauth/oauth";
import { writeConsoleLog, cmsWriteErrorLog } from "../logger";

const ImageRemover = async (fileID: string) => {
  try {
    const authClient = getOauth2Client();
    const drive = google.drive({ version: "v3", auth: authClient });

    const destFolder = getDestFolderID();

    const res = await drive.files.update({
      fileId: fileID,
      requestBody: {
        parents: destFolder !== "" ? [destFolder] : null,
        trashed: true,
      },
    });

    const fileId = res.data.id;
    if (fileId) {
      return {
        success: true,
        data: {
          id: fileId,
        },
      };
    }

    return { success: false, data: "No file id remove from Drive" };
  } catch (err: any) {
    if (err && err.message === "NO_REFRESH_TOKEN" && err.reauthUrl) {
      // reauth required
      return {
        success: false,
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
        (msg.error === "invalid_grant" ||
          msg.error === "unauthorized_client")) ||
      err.message.includes("Request had invalid authentication credentials.")
    ) {
      return {
        success: false,
        type: "redirect",
        data: {
          error: "REAUTH_REQUIRED",
          reauthUrl: startGoogleAuth(),
        },
      };
    }

    writeConsoleLog(
      "error",
      `ImageRemover error.\n${JSON.stringify(err.message)}`,
    );
    cmsWriteErrorLog(`ImageRemover error.\n${JSON.stringify(err.message)}`);
    return { success: false, type: "error", data: err.message || String(err) };
  }
};

export default ImageRemover;
