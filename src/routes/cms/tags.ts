import express, { NextFunction, Request, Response } from "express";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { validateQueryString } from "@/middleware/validator/query_validate";
import { writeConsoleLog } from "@/modules/logger";

import { SessionRequest } from "supertokens-node/framework/express";
const cmsTagsRouter = express.Router();

cmsTagsRouter.get(
  "/list",
 // verifySession(),
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    let pages: any = req.query.pages;

    let validatePage = false;
    if (pages !== undefined && pages !== null && pages !== "") {
      if (!isNaN(pages)) {
        pages = parseInt(pages);

        validatePage = await validateQueryString(
          { pages },
          { groups: ["normalPage"] }
        );
      }
    } else {
      pages = 1;
      validatePage = true;
    }

    if (!validatePage) {
      next(getErrorMsg("404", "invalid pages"));
      return;
    }

    const limit: number = 10;
    pages = (parseInt(pages.toString()) - 1) * limit;

    try {
      const query = `SELECT tags.id, tags.name, COUNT(post_tags.post_id) AS post_count
                    FROM tags AS tags
                      LEFT JOIN post_tags AS post_tags ON tags.id = post_tags.tags_id
                        AND post_tags.data_status = 'active'
                    WHERE tags.data_status = 'active'
                    GROUP BY tags.id
                    ORDER BY post_count DESC, tags.id ASC
                    LIMIT ${limit} OFFSET ${pages};`;

      const [result] = await dbPool.execute(query);
      const data = JSON.parse(JSON.stringify(result));

      // calculate total
      const totalQuery = `SELECT COUNT(tags.id) AS tags_total
      FROM tags AS tags
      WHERE tags.data_status = 'active';`;

      const [totalResult] = await dbPool.execute(totalQuery);
      const tagsTotal = JSON.parse(JSON.stringify(totalResult));

      if (
        Array.isArray(data) &&
        Array.isArray(tagsTotal) &&
        data.length > 0 &&
        tagsTotal.length > 0
      ) {
        return res.send({ data, total: tagsTotal[0].tags_total });
      } else {
        return res.send([]);
      }
    } catch (error) {
      writeConsoleLog("error", `CMS Tag /all error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

export default cmsTagsRouter;
