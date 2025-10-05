const fs = require("fs");

const ImageUploader = async (file: any) => {
  if (!file || !file.path) {
    return { uploaded: false, error: "No file provided" };
  }

  try {
    return { uploaded: false, error: "No file id returned from Drive" };
  } catch (err: any) {
    console.log(err);
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return { uploaded: false, error: err.message || String(err) };
  }
};

export default ImageUploader;
