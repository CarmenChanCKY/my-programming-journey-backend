import { dbPool } from "config/database/connect";
import { PoolConnection } from "mysql2/promise";
import { cmsWriteErrorLog, writeConsoleLog } from "@/modules/logger";

const insertImage = async (
  fileID: string,
  url: string,
  postID: number | null = null
): Promise<{ success: boolean; data: any }> => {
  try {
    const addQuery = `INSERT INTO image_stores (fileID, url, post_id) values (?, ?, ?);`;
    const [result] = await dbPool.execute(addQuery, [fileID, url, postID]);
    const resultData = JSON.parse(JSON.stringify(result));

    if (typeof resultData === "object") {
      return { success: true, data: resultData };
    } else {
      writeConsoleLog(
        "error",
        `insertImage error.\n${JSON.stringify(resultData)}`
      );
      cmsWriteErrorLog("insertImage error");
      cmsWriteErrorLog(resultData);
      return { success: false, data: resultData };
    }
  } catch (error: any) {
    writeConsoleLog("error", `insertImage catch error.\n${error}`);
    cmsWriteErrorLog("insertImage catch error");
    cmsWriteErrorLog(error);
    return { success: false, data: error };
  }
};

const getImageByFileID = async (
  fileID: string
): Promise<{ success: boolean; data: any }> => {
  try {
    const q = `SELECT * FROM image_stores WHERE fileID = ?;`;
    const [rows] = await dbPool.execute(q, [fileID]);
    const resultData = JSON.parse(JSON.stringify(rows));

    if (Array.isArray(resultData) && resultData.length > 0) {
      return { success: true, data: resultData[0] };
    } else {
      return { success: false, data: null };
    }
  } catch (error: any) {
    writeConsoleLog("error", `getImageByFileID catch error.\n${error}`);
    cmsWriteErrorLog("getImageByFileID error");
    cmsWriteErrorLog(error);
    return { success: false, data: error };
  }
};

const getImageByPostID = async (
  postID: number
): Promise<{ success: boolean; data: any }> => {
  try {
    const q = `SELECT * FROM image_stores WHERE post_id = ? ORDER BY id ASC;`;
    const [rows] = await dbPool.execute(q, [postID]);
    const resultData = JSON.parse(JSON.stringify(rows));

    return { success: true, data: resultData };
  } catch (error: any) {
    writeConsoleLog("error", `getImageByPostID catch error.\n${error}`);
    cmsWriteErrorLog("getImageByPostID error");
    cmsWriteErrorLog(error);
    return { success: false, data: error };
  }
};

const removeImageByFileID = async (
  fileID: string
): Promise<{ success: boolean; data: any }> => {
  try {
    const q = `DELETE FROM image_stores WHERE fileID = ?;`;
    const [result] = await dbPool.execute(q, [fileID]);
    const resultData = JSON.parse(JSON.stringify(result));

    if (typeof resultData === "object" && resultData.affectedRows >= 1) {
      return { success: true, data: resultData };
    } else {
      writeConsoleLog(
        "error",
        `removeImageByFileID error.\n${JSON.stringify(resultData)}`
      );
      cmsWriteErrorLog("removeImageByFileID error");
      cmsWriteErrorLog(resultData);
      return { success: false, data: resultData };
    }
  } catch (error: any) {
    writeConsoleLog("error", `removeImageByFileID catch error.\n${error}`);
    cmsWriteErrorLog("removeImageByFileID error");
    cmsWriteErrorLog(error);
    return { success: false, data: error };
  }
};

const removeImageByPostID = async (
  fileID: string
): Promise<{ success: boolean; data: any }> => {
  try {
    const q = `DELETE FROM image_stores WHERE post_id = ?;`;
    const [result] = await dbPool.execute(q, [fileID]);
    const resultData = JSON.parse(JSON.stringify(result));

    if (typeof resultData === "object" && resultData.affectedRows >= 1) {
      return { success: true, data: resultData };
    } else {
      writeConsoleLog(
        "error",
        `removeImageByPostID error.\n${JSON.stringify(resultData)}`
      );
      cmsWriteErrorLog("removeImageByPostID error");
      cmsWriteErrorLog(resultData);
      return { success: false, data: resultData };
    }
  } catch (error: any) {
    writeConsoleLog("error", `removeImageByPostID catch error.\n${error}`);
    cmsWriteErrorLog("removeImageByPostID error");
    cmsWriteErrorLog(error);
    return { success: false, data: error };
  }
};

const removeImageByIDList = async (conn: PoolConnection, idList: Array<number>): Promise<{ success: boolean; data: any }> => {
  try {
    const removeImgQuery = `DELETE FROM image_stores WHERE id IN (${new Array(idList.length).fill("?")
      .join(",")});`;

    const [queryResult] = await conn.execute(removeImgQuery, idList);
    const removeImgResultData = JSON.parse(JSON.stringify(queryResult));

    if (typeof removeImgResultData === "object" && removeImgResultData.affectedRows >= 1) {
      return { success: true, data: removeImgResultData };
    } else {
      writeConsoleLog(
        "error",
        `removeImageByIDList error.\n${JSON.stringify(removeImgResultData)}`
      );
      cmsWriteErrorLog("removeImageByIDList error");
      cmsWriteErrorLog(removeImgResultData);
      return { success: false, data: removeImgResultData };
    }
  } catch (error: any) {
    writeConsoleLog("error", `removeImageByIDList catch error.\n${error}`);
    cmsWriteErrorLog("removeImageByIDList error");
    cmsWriteErrorLog(error);
    return { success: false, data: error };
  }
}

export {
  insertImage,
  getImageByFileID,
  getImageByPostID,
  removeImageByFileID,
  removeImageByPostID,
  removeImageByIDList
};
