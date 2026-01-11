const validateFileSize = (
  file: Express.Multer.File,
  limitFileSize = 8
): { success: boolean; data: string } => {
  if (file.size / 1000 / 1000 > limitFileSize) {
    return {
      success: false,
      data: `File size cannot exceed ${limitFileSize} MB`,
    };
  }

  return { success: true, data: "" };
};

const validateFileType = (
  file: Express.Multer.File
): { success: boolean; data: string } => {
  const fileFormatArr = ["png", "jpeg", "jpg", "gif"];

  if (
    !["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(
      file.mimetype
    )
  ) {
    return {
      success: false,
      data: `Accept ${fileFormatArr.join(", ")} only`,
    };
  }

  return { success: true, data: "" };
};

const getFileExtension = (mimeType: string): string => {
  let result = "";
  switch (mimeType) {
    case "image/jpeg":
      result = ".jpeg";
      break;
    case "image/jpg":
      result = ".jpg";
      break;
    case "image/png":
      result = ".png";
      break;
    case "image/gif":
      result = ".gif";
      break;
    default:
      result = `.${mimeType.split("/")[1]}`;
      break;
  }

  return result;
};

const convertGoogleDriveLink = (shareLink: string): string => {
  const match = shareLink.match(/\/file\/d\/([^/]+)/);
  if (!match) {
    return "";
  }
  const fileId = match[1];
  return `https://lh3.googleusercontent.com/d/${fileId}`;
};

const getFileIDFromGoogleDriveLink = (link: string): string => {
  const split = link.split("https://lh3.googleusercontent.com/d/");
  if (split.length >= 2) {
    return split[split.length - 1];
  }

  return "";
};

export {
  validateFileSize,
  validateFileType,
  getFileExtension,
  convertGoogleDriveLink,
  getFileIDFromGoogleDriveLink,
};
