import { google } from "googleapis";
import {
  apiSetCredentials,
  checkIsAuthError,
  getDestFolderID,
  getOauth2Client,
} from "../google_oauth/oauth";
import { writeConsoleLog, cmsWriteErrorLog } from "../logger";

const ImageRemover = async (fileID: string) => {
  try {
    // get access and refresh token from db
    const { success, type, data } = await apiSetCredentials();
    if (!success) {
      return { success, type, data };
    }

    const authClient = getOauth2Client();
    const drive = google.drive({ version: "v3", auth: authClient });

    const destFolder = getDestFolderID();
    const res = await drive.files.update({
      fileId: fileID,
      addParents: destFolder !== "" ? destFolder : "",
      requestBody: {
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

    return {
      success: false,
      type: "error",
      data: "No file id remove from Drive",
    };
  } catch (err: any) {
    const { type, data } = checkIsAuthError(err);
    if (type === "redirect") {
      return { success: false, type, data };
    } else {
      data.fileID = fileID;
      writeConsoleLog("error", `ImageRemover error.\n${JSON.stringify(data)}`);
      cmsWriteErrorLog(`ImageRemover error.\n${JSON.stringify(data)}`);
      return { success: false, type: "error", data };
    }
  }
};

export default ImageRemover;
