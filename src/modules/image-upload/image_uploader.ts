import { google } from "googleapis";
import {
  getDestFolderID,
  getOauth2Client,
  startGoogleAuth,
} from "../google_oauth/oauth";
import { writeConsoleLog, cmsWriteErrorLog } from "../logger";
import { generateUUIDStr } from "../crypto_helper";
import { convertGoogleDriveLink, getFileExtension } from "./image_validator";
import { insertImage } from "./image_store_db";
const fs = require("fs");

const ImageUploader = async (file: any) => {
  try {
    const authClient = getOauth2Client();
    const drive = google.drive({ version: "v3", auth: authClient });

    const mimeType = file.mimetype;
    const fileName = `${generateUUIDStr()}${getFileExtension(mimeType)}`;

    const destFolder = getDestFolderID();
    const res = await drive.files.create({
      requestBody: {
        parents: destFolder !== "" ? [destFolder] : null,
        name: fileName,
        mimeType,
      },
      media: {
        mimeType,
        body: fs.createReadStream(file.path),
      },
      fields: "id, name, webViewLink, webContentLink",
    });

    const fileId = res.data.id;
    if (fileId) {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      const getRes = await drive.files.get({
        fileId,
        fields: "id, name, webViewLink",
      });

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // save to db
      const insertImg = await insertImage(
        fileId,
        getRes.data.webViewLink ?? "",
        null
      );

      // get embed link
      const embedLink = convertGoogleDriveLink(getRes.data.webViewLink ?? "");

      return {
        success: true,
        data: {
          id: fileId,
          name: getRes.data.name,
          webViewLink: getRes.data.webViewLink,
          embedLink,
        },
      };
    }

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return { success: false, data: "No file id returned from Drive" };
  } catch (err: any) {
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

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
      `ImageUploader error.\n${JSON.stringify(err.message)}`
    );
    cmsWriteErrorLog(`ImageUploader error.\n${JSON.stringify(err.message)}`);
    return { success: false, type: "error", data: err.message || String(err) };
  }
};

export default ImageUploader;
