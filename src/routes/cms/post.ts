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
    // for example, if query is tagsID=1&tagsID=3&tagsID=6, tagsIDArr = ['1','3','6']
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

        valuesArr = [...valuesArr, ...tagsIDArr];
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

      const totalQuery = `SELECT COUNT(post.id) AS post_total
      FROM post
      JOIN (SELECT post_tags.post_id, tags.name
          FROM post_tags JOIN tags
              ON tags.id = post_tags.tags_id AND tags.data_status = 'active'
          WHERE post_tags.data_status = 'active' ${tagsFilterQuery}) AS tag ON tag.post_id = post.id
      WHERE post.data_status = 'active'  ${filterQuery}`;

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

export default cmsPostRouter;
