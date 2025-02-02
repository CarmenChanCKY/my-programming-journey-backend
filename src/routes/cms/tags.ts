import express, { NextFunction, Request, Response } from "express";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { validateQueryString } from "@/middleware/validator/query_validate";
import { cmsWriteErrorLog, writeConsoleLog } from "@/modules/logger";

import { SessionRequest } from "supertokens-node/framework/express";
import { validateTagFormData } from "@/middleware/validator/tags_validator";
const cmsTagsRouter = express.Router();

// get tag list
cmsTagsRouter.get(
  "/",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    let pages: any = req.query.pages;
    let filter: any = req.query.filter?.toString().trim();

    // validate filter if exists
    let validateFilter = false;
    let filterExists = false;
    if (filter !== undefined && filter != null && filter !== "") {
      filterExists = true;
      validateFilter = await validateQueryString({ filter });

      if (validateFilter) {
        // accept the following filter only
        if (["larger", "smaller"].includes(filter)) {
          validateFilter = false;
        }
      }
    } else {
      validateFilter = true;
    }

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

    if (!validateFilter) {
      next(getErrorMsg("404", "invalid filter"));
      return;
    }

    const limit: number = 10;
    pages = (parseInt(pages.toString()) - 1) * limit;

    try {
      let filterQuery = "";
      if (filterExists) {
        switch (filter) {
          case "larger":
            filterQuery = " AND COUNT(post_tags.post_id) > 0 ";
            break;
          case "smaller":
            filterQuery = " AND COUNT(post_tags.post_id) <= 0 ";
            break;
        }
      }
      const query = `SELECT tags.id, tags.name, COUNT(post_tags.post_id) AS post_count
                    FROM tags AS tags
                      LEFT JOIN post_tags AS post_tags ON tags.id = post_tags.tags_id
                        AND post_tags.data_status = 'active'
                    WHERE tags.data_status = 'active' ${filterQuery}
                    GROUP BY tags.id
                    ORDER BY tags.id DESC
                    LIMIT ${limit} OFFSET ${pages};`;

      const [result] = await dbPool.execute(query);
      const data = JSON.parse(JSON.stringify(result));

      // calculate total
      const totalQuery = `SELECT COUNT(tags.id) AS tags_total
      FROM tags AS tags
      WHERE tags.data_status = 'active' ${filterQuery};`;

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

// add new tag
cmsTagsRouter.post(
  "/",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    const data = req.body;

    // validate tag name is not empty
    let validateData = await validateTagFormData(data, "addTag");

    if (!validateData) {
      next(getErrorMsg("422", "invalid input"));
      return;
    }

    const name = data.name.trim();
    try {
      // check whether the tag name is already exist
      const checkQuery = `SELECT id FROM tags WHERE LOWER(name) = ? AND data_status='active';`;
      const [checkResult] = await dbPool.execute(checkQuery, [
        name.toLowerCase(),
      ]);
      const checkData = JSON.parse(JSON.stringify(checkResult));

      if (Array.isArray(checkData) && checkData.length > 0) {
        // tag exists
        next(getErrorMsg("409", "tag exists"));
        return;
      } else {
        const addQuery = `INSERT INTO tags (name, data_status) values (?, ?);`;
        const [result] = await dbPool.execute(addQuery, [name, "active"]);
        const resultData = JSON.parse(JSON.stringify(result));

        if (typeof resultData === "object") {
          return res.send({ data: "insert success" });
        } else {
          next(getErrorMsg("500", "insert fail"));
          writeConsoleLog(
            "error",
            `CMS Tag POST / insert error.\n${JSON.stringify(resultData)}`
          );
          cmsWriteErrorLog("CMS Tag POST / insert error");
          cmsWriteErrorLog(resultData);
          return;
        }
      }
    } catch (error) {
      writeConsoleLog("error", `CMS Tag /add error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

// update tag
cmsTagsRouter.put(
  "/",
  async (req: SessionRequest, res: Response, next: NextFunction) => {}
);

// delete tag
cmsTagsRouter.delete(
  "/:id",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    // req.params.id
  }
);

export default cmsTagsRouter;
