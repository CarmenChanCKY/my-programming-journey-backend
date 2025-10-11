import { encrypt, decrypt } from "@/modules/crypto_helper";
import { dbPool } from "config/database/connect";
import { cmsWriteErrorLog, writeConsoleLog } from "@/modules/logger";

const insertToken = async (
  clientID: string,
  accessToken: string,
  refreshToken: string,
  scope: string,
  token_type: string,
  expiry_date: number
): Promise<{ success: boolean; data: any }> => {
  try {
    // delete previous record in db
    const deleteQuery = "DELETE FROM google_oauth_tokens;";
    const [deleteResult] = await dbPool.execute(deleteQuery);

    const encryptAccess = encrypt(accessToken);
    const encryptRefresh = encrypt(refreshToken);

    const addQuery = `INSERT INTO google_oauth_tokens (client_id,
     refresh_token, refresh_iv, refresh_tag,
     access_token, access_iv, access_tag,
     scope, token_type, expires_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
    const [result] = await dbPool.execute(addQuery, [
      clientID,
      encryptRefresh.cipher,
      encryptRefresh.iv,
      encryptRefresh.tag,
      encryptAccess.cipher,
      encryptAccess.iv,
      encryptAccess.tag,
      scope,
      token_type,
      expiry_date.toString(),
    ]);
    const resultData = JSON.parse(JSON.stringify(result));

    if (typeof resultData === "object") {
      return { success: true, data: resultData };
    } else {
      writeConsoleLog(
        "error",
        `insertToken error.\n${JSON.stringify(resultData)}`
      );
      cmsWriteErrorLog("insertToken error");
      cmsWriteErrorLog(resultData);
      return { success: false, data: resultData };
    }
  } catch (error: any) {
    writeConsoleLog("error", `insertToken catch error.\n${error}`);
    return { success: false, data: error };
  }
};

const getToken = async (
  clientID: string
): Promise<{ success: boolean; data: any }> => {
  try {
    const query = `SELECT * FROM google_oauth_tokens WHERE client_id = ? order by expires_at DESC LIMIT 1 OFFSET 0;`;
    const [queryResult] = await dbPool.execute(query, [clientID]);
    let data = JSON.parse(JSON.stringify(queryResult));

    if (Array.isArray(data) && data.length > 0) {
      data = data[0];

      const refreshToken = decrypt(
        data.refresh_token,
        data.refresh_iv,
        data.refresh_tag
      );

      const accessToken = decrypt(
        data.access_token,
        data.access_iv,
        data.access_tag
      );

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          scope: data.scope,
          tokenType: data.token_type,
          expiresAt: data.expires_at,
        },
      };
    } else {
      writeConsoleLog("error", `getToken error.\n${JSON.stringify(data)}`);
      cmsWriteErrorLog("getToken error");
      cmsWriteErrorLog(JSON.stringify(data));
      return { success: false, data: data };
    }
  } catch (error) {
    writeConsoleLog("error", `getToken catch error.\n${error}`);
    return { success: false, data: error };
  }
};

export { insertToken, getToken };
