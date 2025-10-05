import express, { NextFunction, Response } from "express";
import { SessionRequest } from "supertokens-node/framework/express";
import multer from "multer";
import ImageUploader from "@/modules/image-upload/image_uploader";
import os from "os";
import { getToken } from "@/modules/google_oauth/oauth_db";
import { getClientID, startGoogleAuth } from "@/modules/google_oauth/oauth";

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
    // TODO: get access and refresh token from db
    const tokenResult = await getToken(getClientID());

    return res.send({
      type: "redirect",
      data: startGoogleAuth(),
    });
  }
);

export default cmsUploaderRouter;
