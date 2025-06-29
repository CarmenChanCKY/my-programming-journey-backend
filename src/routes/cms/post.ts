import express, { NextFunction, Response } from "express";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { validateQueryString } from "@/middleware/validator/query_validate";
import { cmsWriteErrorLog, writeConsoleLog } from "@/modules/logger";
import { SessionRequest } from "supertokens-node/framework/express";

const cmsPostRouter = express.Router();

// get post list
cmsPostRouter.get(
  "/",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    let pages: any = req.query.pages;

    let filterPostTitle: any = req.query.postTitle
      ?.toString()
      .toLowerCase()
      .trim();

    let categoryID: any = req.query.categoryID;
    if (!isNaN(Number(categoryID))) {
      categoryID = parseInt(categoryID);
    }

    // it will return an array
    // for example, if query is tagsID[]=1&tagsID[]=3&tagsID[]=6, tagsIDArr = ['1','3','6']
    let tagsIDArr: any = req.query.tagsID;

    // validate post title if exists
    let validatePostTitle = false;
    let postTitleExists = false;
    if (
      filterPostTitle !== undefined &&
      filterPostTitle != null &&
      filterPostTitle !== ""
    ) {
      validatePostTitle = await validateQueryString({
        filter: filterPostTitle,
      });
      postTitleExists = true;
    } else {
      validatePostTitle = true;
    }

    // validate categoryID if exists
    let validateCategoryID = false;
    let categoryIDExists = false;
    if (categoryID !== undefined && categoryID != null && categoryID !== "") {
      validateCategoryID = await validateQueryString({ id: categoryID });
      categoryIDExists = true;
    } else {
      validateCategoryID = true;
    }

    // validate tagsIDArr if exists
    let validateTagsIDArr = false;
    let tagsIDArrExists = false;
    if (tagsIDArr !== undefined && tagsIDArr != null && tagsIDArr !== "") {
      tagsIDArr = tagsIDArr.map((item: string) => {
        return parseInt(item);
      });
      validateTagsIDArr = await validateQueryString({ intArr: tagsIDArr });
      tagsIDArrExists = true;
    } else {
      validateTagsIDArr = true;
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

    if (!validatePostTitle) {
      next(getErrorMsg("422", "invalid post title"));
      return;
    }

    if (!validateCategoryID) {
      next(getErrorMsg("422", "invalid category id"));
      return;
    }

    if (!validateTagsIDArr) {
      next(getErrorMsg("422", "invalid tags id"));
      return;
    }

    if (!validatePage) {
      next(getErrorMsg("422", "invalid pages"));
      return;
    }

    const limit: number = 10;
    pages = (parseInt(pages.toString()) - 1) * limit;

    try {
      let filterQuery = "";
      let tagsFilterQuery = "";
      let valuesArr = [];

      if (postTitleExists) {
        const startStr = dbPool.escape("\\b" + filterPostTitle);
        const middleStr = dbPool.escape("\\b" + filterPostTitle + "\\b");
        const endStr = dbPool.escape(filterPostTitle + "\\b");

        // query for search title
        const compareTitle = "LOWER(post.title)";
        filterQuery += ` AND (${compareTitle} REGEXP ${startStr} OR ${compareTitle} REGEXP ${endStr} OR ${compareTitle} REGEXP ${middleStr})`;
      }

      if (categoryIDExists) {
        filterQuery += ` AND post.category_id = ?`;
        valuesArr.push(categoryID);
      }

      if (tagsIDArrExists) {
        let filterValueCount = Array(tagsIDArr.length).fill("?");

        valuesArr = [...tagsIDArr, ...valuesArr];
        tagsFilterQuery += ` AND post_tags.tags_id IN (${filterValueCount.join(
          ","
        )})`;
      }

      const query = `SELECT post.id, post.title, post.date, post.slug, category.name AS category_name, JSON_ARRAYAGG(tag.name) AS tags_data
                    FROM post
                    LEFT JOIN category on category.id = post.category_id AND category.data_status = 'active'
                    JOIN (SELECT post_tags.post_id, tags.name
                        FROM post_tags JOIN tags
                            ON tags.id = post_tags.tags_id AND tags.data_status = 'active'
                        WHERE post_tags.data_status = 'active' ${tagsFilterQuery}) AS tag ON tag.post_id = post.id
                    WHERE post.data_status = 'active' ${filterQuery}
                    GROUP BY post.id
                    ORDER BY post.date DESC, post.id DESC
                    LIMIT ${limit} OFFSET ${pages}`;

      const [result] = await dbPool.execute(query, valuesArr);

      const totalQuery = `SELECT COUNT(DISTINCT post.id) AS post_total
      FROM post
      JOIN (SELECT post_tags.post_id, tags.name
          FROM post_tags JOIN tags
              ON tags.id = post_tags.tags_id AND tags.data_status = 'active'
          WHERE post_tags.data_status = 'active' ${tagsFilterQuery}) AS tag ON tag.post_id = post.id
      WHERE post.data_status = 'active' ${filterQuery}`;

      const [totalResult] = await dbPool.execute(totalQuery, valuesArr);
      const data = JSON.parse(JSON.stringify(result));
      const total = JSON.parse(JSON.stringify(totalResult));

      if (
        Array.isArray(data) &&
        Array.isArray(total) &&
        data.length > 0 &&
        total.length > 0
      ) {
        res.send({ data, total: total[0].post_total });
      } else {
        return res.send([]);
      }
    } catch (error) {
      writeConsoleLog("error", `CMS Post GET / error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

// delete post
// TODO: need to test
cmsPostRouter.post(
  "/delete",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    let id = req.body.id;

    // validate post id is valid
    let validateData = await validateQueryString({ id: id });

    if (!validateData) {
      next(getErrorMsg("422", "invalid input"));
      return;
    }

    id = parseInt(id);
    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      // check post id exists
      const checkQuery = `SELECT id FROM post WHERE id = ? AND data_status = 'inactive';`;
      const [checkResult] = await conn.execute(checkQuery, [id]);
      const checkData = JSON.parse(JSON.stringify(checkResult));

      // search from post_tags to get the related tags id
      const checkTagsQuery = `SELECT id FROM post_tags WHERE post_id = ? AND data_status = 'inactive';`;
      const [checkTagsResult] = await conn.execute(checkTagsQuery, [id]);
      const checkTagsData = JSON.parse(JSON.stringify(checkTagsResult));

      if (
        Array.isArray(checkData) &&
        checkData.length > 0 &&
        Array.isArray(checkTagsData) &&
        checkTagsData.length > 0
      ) {
        // soft delete from post_tags
        const removePostTagsQuery = `UPDATE post_tags SET data_status = 'active' WHERE post_id = ? AND data_status = 'inactive';`;
        const [removePostTagsResult] = await conn.execute(removePostTagsQuery, [
          id,
        ]);
        const removePostTagsData = JSON.parse(
          JSON.stringify(removePostTagsResult)
        );

        // soft delete the post
        const removeQuery = `UPDATE post SET data_status = 'active' WHERE id = ? and data_status = 'inactive';`;
        const [result] = await conn.execute(removeQuery, [id]);
        const deletePostData = JSON.parse(JSON.stringify(result));

        conn.commit();

        if (
          typeof removePostTagsData === "object" &&
          typeof deletePostData === "object" &&
          removePostTagsData.affectedRows >= 1 &&
          deletePostData.affectedRows >= 1
        ) {
          return res.send({ data: "remove success" });
        } else {
          next(getErrorMsg("500", "remove fail"));
          writeConsoleLog(
            "error",
            `CMS Post POST /delete error.\n removePostTagsData: ${JSON.stringify(
              removePostTagsData
            )} \n deletePostData: ${JSON.stringify(deletePostData)}`
          );
          cmsWriteErrorLog("CMS Post POST /delete error");
          cmsWriteErrorLog(removePostTagsData);
          cmsWriteErrorLog(deletePostData);
        }
      } else {
        next(getErrorMsg("409", "post not found"));
        conn.rollback();
        return;
      }
    } catch (error) {
      writeConsoleLog("error", `CMS Post POST /delete error.\n${error}`);
      next(getErrorMsg("500", "", error));
      conn.rollback();
      return;
    } finally {
      if (conn) {
        conn.release();
      }
    }
  }
);

export default cmsPostRouter;
