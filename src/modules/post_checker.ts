import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { PoolConnection } from "mysql2/promise";
import { getFileIDFromGoogleDriveLink } from "./image_upload/image_validator";

// helper function for validating input data
const categoryChecker = async (conn: PoolConnection, categoryID: number) => {
  const checkCategoryQuery = `SELECT id FROM category WHERE id = ? AND data_status = 'active';`;
  const [checkResult] = await conn.execute(checkCategoryQuery, [categoryID]);
  const checkCategoryData = JSON.parse(JSON.stringify(checkResult));
  if (!(Array.isArray(checkCategoryData) && checkCategoryData.length > 0)) {
    // category not found
    return { result: false, msg: getErrorMsg("409", "category not found") };
  }

  return { result: true, msg: "" };
};

const tagsChecker = async (conn: PoolConnection, tagsIDList: Array<number>) => {
  const checkTagsQuery = `SELECT tags.id FROM tags WHERE tags.data_status='active' AND tags.id IN (${Array(
    tagsIDList.length,
  )
    .fill("?")
    .join(",")});`;

  const [checkResult] = await conn.execute(checkTagsQuery, [...tagsIDList]);
  const checkTagsData = JSON.parse(JSON.stringify(checkResult));

  let tagsNotFound = true;

  if (Array.isArray(checkTagsData) && checkTagsData.length > 0) {
    if (checkTagsData.length === tagsIDList.length) {
      tagsNotFound = false;
    }
  }

  if (tagsNotFound) {
    // tags not found
    return { result: false, msg: getErrorMsg("409", "some tags not found") };
  }

  return { result: true, msg: "" };
};

const searchImageListExists = async (
  conn: PoolConnection,
  imageList: Array<string>,
  post_id?: number,
) => {
  // get related image record stored in db
  let getImageRecordQuery = `select * from image_stores WHERE post_id IS NULL`;

  const params = [];
  if (post_id !== undefined && post_id !== null && !isNaN(post_id)) {
    getImageRecordQuery = `${getImageRecordQuery} OR post_id = ?`;
    params.push(post_id);
  }

  const [getResult] = await conn.execute(getImageRecordQuery, params);
  const dbImageList = JSON.parse(JSON.stringify(getResult));

  const notFoundList = [];
  const updateList = [];

  for (let i = 0; i < imageList.length; i++) {
    const fileID = getFileIDFromGoogleDriveLink(imageList[i]);
    if (fileID !== "") {
      const findInDB = dbImageList.find((obj: any) => {
        return obj.fileID === fileID;
      });

      if (findInDB !== undefined) {
        updateList.push({ id: findInDB.id, fileID: fileID });
      } else {
        notFoundList.push(imageList[i]);
      }
    }
  }

  if (notFoundList.length > 0) {
    return { result: false, msg: "some file id not found", file: notFoundList };
  }

  return { result: true, msg: "", file: updateList };
};

export { categoryChecker, tagsChecker, searchImageListExists };
