import express, { NextFunction, Request, Response } from "express";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { removeHTMLTags } from "@/modules/common_module";
import { validateQueryString } from "@/middleware/validator/query_validate";
import { writeConsoleLog } from "@/modules/logger";

const categoriesRouter = express.Router();

categoriesRouter.get(
  "/all",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = `SELECT post.title, post.date, post.category_id, post.slug, post.id
                   FROM post
                   JOIN category ON category.id = post.category_id
                        AND category.data_status = 'active'
                   WHERE post.data_status = 'active' AND post.hide_post = 0
                   ORDER BY post.date DESC , post.id DESC`;

      const [result] = await dbPool.execute(query);

      const groupQuery = `SELECT category.id, category.name as category_name, COUNT(post.id) as post_count
                        FROM post
                        JOIN category ON category.id = post.category_id
                             AND category.data_status = 'active'
                        WHERE post.data_status = 'active' AND post.hide_post = 0
                        GROUP BY category.id, category.name
                        HAVING COUNT(post.id) > 0
                        ORDER BY category.id ASC`;

      const [groupResult] = await dbPool.execute(groupQuery);

      const data = JSON.parse(JSON.stringify(result));
      const groupData = JSON.parse(JSON.stringify(groupResult));

      if (
        Array.isArray(data) &&
        Array.isArray(groupData) &&
        data.length > 0 &&
        groupData.length > 0
      ) {
        const resultData = [];

        for (let i = 0; i < groupData.length; i++) {
          const list = data.filter((obj) => {
            return obj.category_id === groupData[i].id;
          });

          resultData.push({
            listTitle: groupData[i].category_name,
            list,
          });
        }

        return res.send({ postList: resultData, categoryList: groupData });
      } else {
        return res.send([]);
      }
    } catch (error) {
      writeConsoleLog("error", `Category /all error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

categoriesRouter.get(
  "/list",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let category: any = req.query.category?.toString().trim();
      let pages: any = req.query.pages;

      let validateCategory = await validateQueryString({ keyword: category });

      let validatePage = false;

      if (pages !== undefined && pages !== null && pages !== "") {
        if (!isNaN(pages)) {
          pages = parseInt(pages);

          let validateInt = await validateQueryString(
            { pages },
            { groups: ["normalPage"] }
          );

          if (validateInt) {
            validatePage = true;
          }
        }
      } else {
        pages = 1;
        validatePage = true;
      }

      if (!validatePage) {
        next(getErrorMsg("404", "invalid pages"));
        return;
      } else if (!validateCategory) {
        next(getErrorMsg("404", "invalid category"));
        return;
      }

      const limit: number = 10;
      pages = (parseInt(pages.toString()) - 1) * limit;

      const query = `SELECT post.title, post.date, post.content, post.slug, post.category_id,
                      category.name AS category_name, tag.tags_data
                  FROM post
                  JOIN category on category.id = post.category_id AND category.data_status = 'active' AND LOWER(category.name) = LOWER(?)
                  LEFT JOIN (SELECT post_tags.post_id, JSON_ARRAYAGG(JSON_OBJECT("id", tags.id, "name", tags.name)) AS tags_data
                      FROM post_tags
                      JOIN tags AS tags
                          ON tags.id = post_tags.tags_id AND tags.data_status = 'active'
                      WHERE post_tags.data_status = 'active'
                      GROUP BY post_tags.post_id) AS tag ON tag.post_id = post.id
                  WHERE post.data_status = 'active' AND post.hide_post = 0
                  ORDER BY post.date DESC , post.id DESC
                  LIMIT ${limit} OFFSET ${pages}`;

      const [result] = await dbPool.execute(query, [category]);

      const totalQuery = `SELECT COUNT(post.id) AS post_total
                        FROM post AS post
                        JOIN category on category.id = post.category_id AND category.data_status = 'active' AND LOWER(category.name) = LOWER(?)
                        WHERE post.data_status = 'active' AND post.hide_post = 0`;

      const [totalResult] = await dbPool.execute(totalQuery, [category]);

      const data = JSON.parse(JSON.stringify(result));
      const total = JSON.parse(JSON.stringify(totalResult));

      if (
        Array.isArray(data) &&
        Array.isArray(total) &&
        data.length > 0 &&
        total.length > 0
      ) {
        for (let i = 0; i < data.length; i++) {
          data[i].content = removeHTMLTags(data[i].content);
        }

        return res.send({ data, total: total[0].post_total });
      } else {
        return res.send([]);
      }
    } catch (error) {
      writeConsoleLog("error", `Category /list error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

export default categoriesRouter;
