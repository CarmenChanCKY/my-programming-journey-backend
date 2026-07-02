import express, { NextFunction, Request, Response } from "express";
import multer from "multer";
import ImageUploader from "@/modules/image_upload/image_uploader";
import os from "os";
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
  async (req: Request, res: Response, next: NextFunction) => {
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

    return res.send(await ImageUploader(req.file));
  }
);

export default cmsUploaderRouter;
