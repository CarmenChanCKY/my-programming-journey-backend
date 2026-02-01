import { google } from "googleapis";
import {
  apiSetCredentials,
  checkIsAuthError,
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
    // get access and refresh token from db
    const { success, type, data } = await apiSetCredentials();
    if (!success) {
      return { success, type, data };
    }

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

    const { type, data } = checkIsAuthError(err);
    if (type === "redirect") {
      return { success: false, type, data };
    } else {
      writeConsoleLog("error", `ImageUploader error.\n${JSON.stringify(data)}`);
      cmsWriteErrorLog(`ImageUploader error.\n${JSON.stringify(data)}`);
      return { success: false, type: "error", data };
    }
  }
};

export default ImageUploader;
