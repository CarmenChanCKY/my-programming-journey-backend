import express, { NextFunction, Response } from "express";
import { SessionRequest } from "supertokens-node/framework/express";
import multer from "multer";
import ImageUploader from "@/modules/image_upload/image_uploader";
import os from "os";
import { getToken } from "@/modules/google_oauth/oauth_db";
import {
  getClientID,
  setCredentials,
  startGoogleAuth,
} from "@/modules/google_oauth/oauth";
import {
  validateFileSize,
  validateFileType,
} from "@/modules/image_upload/image_validator";

const cmsUploaderRouter = express.Router();

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, callback) => callback(null, `${file.originalname}`),
});
const upload = multer({ storage: storage });

cmsUploaderRouter.post(
  "/",
  upload.single("file"),
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    if (!req.file || !req.file.path) {
      return res.send({
        success: false,
        type: "error",
        data: "No file provided",
      });
    }

    // validate upload file
    const fileSizeValid = validateFileSize(req.file);
    if (!fileSizeValid.success) {
      return res.send(fileSizeValid);
    }

    const fileTypeValid = validateFileType(req.file);
    if (!fileTypeValid.success) {
      return res.send(fileTypeValid);
    }

    // get access and refresh token from db
    const tokenResult = await getToken(getClientID());
    if (tokenResult.success) {
      setCredentials(
        tokenResult.data.refreshToken,
        tokenResult.data.accessToken
      );
      return res.send(await ImageUploader(req.file));
    } else {
      return res.send({
        success: false,
        type: "redirect",
        data: startGoogleAuth(),
      });
    }
  }
);

export default cmsUploaderRouter;
