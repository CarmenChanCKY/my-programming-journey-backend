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

export { validateFileSize, validateFileType };
