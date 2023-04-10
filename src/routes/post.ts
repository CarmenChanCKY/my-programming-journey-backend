import express, { NextFunction, Request, Response } from "express";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";

const postRouter = express.Router();

postRouter.get("/list", async (req: Request, res: Response, next: NextFunction) => {
  try {
    let pages: any = req.query.pages;

    if (
      pages === undefined ||
      pages === null ||
      pages === "" ||
      isNaN(Number(pages))
    ) {
      return res.status(422).end("invalid pages");
    }

    const limit: number = 10;
    pages = (parseInt(pages.toString()) - 1) * limit;

    if (pages < 0) {
      return res.status(422).end("pages cannot smaller than or equals 0");
    }

    const query = `SELECT post.title, post.date, post.content, post.slug, categories.name AS category_name, tag.tags_name
                  FROM post
                  LEFT JOIN (SELECT post_category.post_id, category.name
                    FROM post_category
                    JOIN category ON category.id = post_category.category_id
                        AND category.data_status = 'active') as categories on categories.post_id = post.id
                  LEFT JOIN (SELECT post_tags.post_id, JSON_ARRAYAGG(tags.name) AS tags_name
                      FROM post_tags
                      JOIN tags AS tags
                          ON tags.id = post_tags.tags_id AND tags.data_status = 'active'
                      WHERE post_tags.data_status = 'active'
                      GROUP BY post_tags.post_id) AS tag ON tag.post_id = post.id
                  WHERE post.data_status = 'active'
                  ORDER BY post.date DESC , post.id DESC
                  LIMIT ${limit} OFFSET ${pages}`;

    const [result] = await dbPool.execute(query, []);

    const totalQuery = `SELECT COUNT(post.id) AS post_total
                        FROM post AS post
                        WHERE post.data_status = 'active'`;

    const [totalResult] = await dbPool.execute(totalQuery, []);
    const data = JSON.parse(JSON.stringify(result));
    const total = JSON.parse(JSON.stringify(totalResult));

    if (
      Array.isArray(result) &&
      Array.isArray(totalResult) &&
      result.length > 0 &&
      totalResult.length > 0
    ) {
      res.send({ data, total: total[0].post_total });
    } else {
      // throw new Error('BROKEN')
      return res.status(422).end("record not found");
    }
  } catch (error) {
    return res.status(500).end(getErrorMsg("500", error));
  }
});

postRouter.get("/detail", async (req: Request, res: Response) => {
  try {
    let postSlug: any = req.query.slug;

    if (postSlug === undefined || postSlug === null || postSlug === "") {
      return res.status(422).end("invalid post slug");
    }

    const query = `SELECT post.title, post.date, post.content, post.slug,
                      categories.name AS category_name, tag.tags_name, reference.reference_array
                    FROM post
                    LEFT JOIN (SELECT post_category.post_id, category.name
                      FROM post_category
                      JOIN category ON category.id = post_category.category_id
                        AND category.data_status = 'active'
                      WHERE post_category.data_status = 'active') AS categories ON categories.post_id = post.id
                    LEFT JOIN (SELECT post_tags.post_id, JSON_ARRAYAGG(tags.name) AS tags_name
                      FROM post_tags
                      JOIN tags ON tags.id = post_tags.tags_id
                        AND tags.data_status = 'active'
                      WHERE post_tags.data_status = 'active'
                      GROUP BY post_tags.post_id) AS tag ON tag.post_id = post.id
                    LEFT JOIN (SELECT post_reference.post_id,
                        JSON_arrayagg(JSON_OBJECT('name', post_reference.name, 'hyperlink', post_reference.hyperlink)) AS reference_array
                      FROM post_reference 
                      WHERE post_reference.data_status = 'active'
                      group by post_reference.post_id) AS reference ON post.id = reference.post_id
                    WHERE post.data_status = 'active' AND post.slug = ?`;

    const [result] = await dbPool.execute(query, [postSlug]);

    const data = JSON.parse(JSON.stringify(result));

    if (Array.isArray(result) && result.length > 0) {
      res.send(data);
    } else {
      return res.status(422).end("record not found");
    }
  } catch (error) {
    return res.status(500).end(getErrorMsg("500", error));
  }
});

export default postRouter;
