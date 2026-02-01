import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { PoolConnection } from "mysql2/promise";
import { getFileIDFromGoogleDriveLink } from "./image_upload/image_validator";

// helper function for validating input data
const categoryChecker = async (
  conn: PoolConnection,
  categoryID: number,
): Promise<{ result: boolean; msg: any }> => {
  const checkCategoryQuery = `SELECT id FROM category WHERE id = ? AND data_status = 'active';`;
  const [checkResult] = await conn.execute(checkCategoryQuery, [categoryID]);
  const checkCategoryData = JSON.parse(JSON.stringify(checkResult));
  if (!(Array.isArray(checkCategoryData) && checkCategoryData.length > 0)) {
    // category not found
    return { result: false, msg: getErrorMsg("409", "category not found") };
  }

  return { result: true, msg: "" };
};

const tagsChecker = async (
  conn: PoolConnection,
  tagsIDList: Array<number>,
): Promise<{ result: boolean; msg: any }> => {
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
): Promise<{
  result: boolean;
  msg: string;
  updateList: Array<{ id: number; fileID: string }>;
  removeList: Array<{ id: number; fileID: string }>;
  notFoundList?: Array<string>;
}> => {
  // get related image record stored in db
  let getImageRecordQuery = `select * from image_stores WHERE post_id IS NULL`;

  const params = [];
  if (post_id !== undefined && post_id !== null && !isNaN(post_id)) {
    getImageRecordQuery = `${getImageRecordQuery} OR post_id = ?`;
    params.push(post_id);
  }

  const [getResult] = await conn.execute(getImageRecordQuery, params);
  const dbImageList = JSON.parse(JSON.stringify(getResult));

  const notFoundList: Array<string> = [];
  const updateList: Array<{ id: number; fileID: string }> = [];
  let removeList: Array<{ id: number; fileID: string }> = [];

  for (let i = 0; i < imageList.length; i++) {
    const fileID = getFileIDFromGoogleDriveLink(imageList[i]);
    if (fileID !== "") {
      const index = dbImageList.findIndex((obj: any) => {
        return obj.fileID === fileID;
      });

      if (index !== -1) {
        updateList.push({ id: dbImageList[index].id, fileID: fileID });
        dbImageList.splice(index, 1);
      } else {
        notFoundList.push(imageList[i]);
      }
    }
  }

  removeList = dbImageList.map((obj: any) => {
    return { id: obj.id, fileID: obj.fileID };
  });

  if (notFoundList.length > 0) {
    return {
      result: false,
      msg: "some file id not found",
      updateList: updateList,
      removeList: removeList,
      notFoundList: notFoundList,
    };
  }

  return {
    result: true,
    msg: "",
    updateList: updateList,
    removeList: removeList,
  };
};

export { categoryChecker, tagsChecker, searchImageListExists };
