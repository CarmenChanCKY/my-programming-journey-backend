import express, { NextFunction, Request, Response } from "express";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { validateQueryString } from "@/middleware/validator/query_validate";
import { removeHTMLTags } from "@/modules/common_module";
import { writeConsoleLog } from "@/modules/logger";

const postRouter = express.Router();

postRouter.get(
  "/list",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let pages: any = req.query.pages;

      let error = true;

      if (pages !== undefined && pages !== null && pages !== "") {
        if (!isNaN(pages)) {
          pages = parseInt(pages);

          let validateInt = await validateQueryString(
            { pages },
            { groups: ["normalPage"] }
          );

          if (validateInt) {
            error = false;
          }
        }
      } else {
        pages = 1;
        error = false;
      }

      if (error) {
        next(getErrorMsg("404", "invalid pages"));
        return;
      }

      const limit: number = 10;
      pages = (parseInt(pages.toString()) - 1) * limit;

      const query = `SELECT post.title, post.date, post.content, post.slug, post.category_id,
                      category.name AS category_name, tag.tags_data
                  FROM post
                  LEFT JOIN category on category.id = post.category_id AND category.data_status = 'active'
                  LEFT JOIN (SELECT post_tags.post_id, JSON_ARRAYAGG(JSON_OBJECT("id", tags.id, "name", tags.name)) AS tags_data
                      FROM post_tags
                      JOIN tags AS tags
                          ON tags.id = post_tags.tags_id AND tags.data_status = 'active'
                      WHERE post_tags.data_status = 'active'
                      GROUP BY post_tags.post_id) AS tag ON tag.post_id = post.id
                  WHERE post.data_status = 'active' AND post.hide_post = 0
                  ORDER BY post.date DESC , post.id DESC
                  LIMIT ${limit} OFFSET ${pages}`;

      const [result] = await dbPool.execute(query, []);

      const totalQuery = `SELECT COUNT(post.id) AS post_total
                        FROM post AS post
                        WHERE post.data_status = 'active' AND post.hide_post = 0`;

      const [totalResult] = await dbPool.execute(totalQuery, []);
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

        res.send({ data, total: total[0].post_total });
      } else {
        return res.send([]);
      }
    } catch (error) {
      writeConsoleLog("error", `Post /list error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

postRouter.get(
  "/detail",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let postSlug: any = req.query.slug?.toString().trim();

      let validateEmpty = await validateQueryString({ slug: postSlug });
      if (!validateEmpty) {
        next(getErrorMsg("404", "invalid post slug"));
        return;
      }

      const query = `SELECT post.id, post.title, post.date, post.content, post.slug, post.category_id, post.meta_description, post.meta_keyword,
                      category.name AS category_name, tag.tags_data, reference.reference_array
                    FROM post
                    LEFT JOIN category ON category.id = post.category_id AND category.data_status = 'active'
                    LEFT JOIN (SELECT post_tags.post_id, JSON_ARRAYAGG(JSON_OBJECT("id", tags.id, "name", tags.name)) AS tags_data
                      FROM post_tags
                      JOIN tags ON tags.id = post_tags.tags_id
                        AND tags.data_status = 'active'
                      WHERE post_tags.data_status = 'active'
                      GROUP BY post_tags.post_id) AS tag ON tag.post_id = post.id
                    LEFT JOIN (SELECT post_reference.post_id,
                        JSON_ARRAYAGG(JSON_OBJECT('name', post_reference.name, 'hyperlink', post_reference.hyperlink)) AS reference_array
                      FROM post_reference
                      WHERE post_reference.data_status = 'active'
                      group by post_reference.post_id) AS reference ON post.id = reference.post_id
                    WHERE post.data_status = 'active' AND post.hide_post = 0 AND post.slug = ?`;

      const [result] = await dbPool.execute(query, [postSlug]);

      const data = JSON.parse(JSON.stringify(result));

      if (Array.isArray(data) && data.length > 0) {
        if (
          data[0].meta_keyword === undefined ||
          data[0].meta_keyword === null ||
          data[0].meta_keyword === ""
        ) {
          if (
            data[0].tags_data !== undefined &&
            data[0].tags_data !== null &&
            data[0].tags_data != ""
          ) {
            data[0].meta_keyword = data[0].tags_data
              .map((obj: any) => {
                return obj.name;
              })
              .join(", ");
          } else {
            data[0].meta_keyword = "";
          }
        }

        res.send(data[0]);
      } else {
        next(getErrorMsg("404", "record not found"));
        return;
      }
    } catch (error) {
      writeConsoleLog("error", `Post /detail error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

postRouter.get(
  "/next",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let id: any = req.query.id;

      if (!isNaN(Number(id))) {
        id = parseInt(id);
      }

      let validateID = await validateQueryString({ id });

      if (!validateID) {
        next(getErrorMsg("404", "invalid id"));
        return;
      }

      const query = `SELECT title, slug FROM post WHERE id > ? AND hide_post = 0 ORDER BY date ASC, id ASC LIMIT 1 OFFSET 0`;

      const [result] = await dbPool.execute(query, [id]);
      const data = JSON.parse(JSON.stringify(result));

      if (Array.isArray(data) && data.length > 0) {
        res.send(data[0]);
      } else {
        res.send({});
      }
    } catch (error) {
      writeConsoleLog("error", `Post /next error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

postRouter.get(
  "/previous",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let id: any = req.query.id;

      if (!isNaN(Number(id))) {
        id = parseInt(id);
      }

      let validateID = await validateQueryString({ id });

      if (!validateID) {
        next(getErrorMsg("404", "invalid id"));
        return;
      }

      const query = `SELECT title, slug FROM post WHERE id < ? AND hide_post = 0 ORDER BY date DESC, id DESC LIMIT 1 OFFSET 0`;

      const [result] = await dbPool.execute(query, [id]);
      const data = JSON.parse(JSON.stringify(result));

      if (Array.isArray(data) && data.length > 0) {
        res.send(data[0]);
      } else {
        res.send({});
      }
    } catch (error) {
      writeConsoleLog("error", `Post /previous error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

postRouter.get(
  "/archive",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let pages: any = req.query.pages;

      let pagingStr = "";
      if (pages != undefined && pages != null && pages !== "") {
        let error = true;

        if (!isNaN(pages)) {
          pages = parseInt(pages);

          let validateInt = await validateQueryString(
            { pages },
            { groups: ["normalPage"] }
          );

          if (validateInt) {
            error = false;
          }
        }

        if (error) {
          next(getErrorMsg("404", "invalid pages"));
          return;
        }

        const limit: number = 10;
        pages = (parseInt(pages.toString()) - 1) * limit;

        pagingStr = `LIMIT ${limit} OFFSET ${pages}`;
      }

      const query = `SELECT SUBSTRING_INDEX(p.date, '-', 2) as post_year_month,
                    JSON_ARRAYAGG(JSON_OBJECT('date', p.date, 'title', p.title, 'slug', p.slug)) as post_list
                  FROM (SELECT post.date, post.title, post.slug
                        FROM post
                        WHERE post.data_status = 'active' AND post.hide_post = 0
                        ORDER BY post.date DESC , post.id DESC ${pagingStr}) AS p
                  GROUP BY SUBSTRING_INDEX(p.date, '-', 2)
                  ORDER BY SUBSTRING_INDEX(p.date, '-', 2) DESC`;

      const [result] = await dbPool.execute(query, []);

      const totalQuery = `SELECT COUNT(post.id) AS post_total
                        FROM post AS post
                        WHERE post.data_status = 'active' AND post.hide_post = 0`;

      const [totalResult] = await dbPool.execute(totalQuery, []);
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
      writeConsoleLog("error", `Post /archive error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

export default postRouter;
