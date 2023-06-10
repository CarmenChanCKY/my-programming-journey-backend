import express, { NextFunction, Request, Response } from "express";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";

const postRouter = express.Router();

postRouter.get(
  "/list",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let pages: any = req.query.pages;

      if (
        pages === undefined ||
        pages === null ||
        pages === "" ||
        isNaN(Number(pages))
      ) {
        return res.status(404).end("invalid pages");
      }

      const limit: number = 10;
      pages = (parseInt(pages.toString()) - 1) * limit;

      if (pages < 0) {
        return res.status(422).end("pages cannot smaller than or equals 0");
      }

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
        Array.isArray(data) &&
        Array.isArray(total) &&
        data.length > 0 &&
        total.length > 0
      ) {
        const regex = new RegExp("</?[^>]+(>|$)", "gi");
        for (let i = 0; i < data.length; i++) {
          data[i].content = data[i].content.replaceAll(regex, "");
        }

        res.send({ data, total: total[0].post_total });
      } else {
        // throw new Error('BROKEN')
        return res.status(404).end("record not found");
      }
    } catch (error) {
      return res.status(500).end(getErrorMsg("500", error));
    }
  }
);

postRouter.get("/detail", async (req: Request, res: Response) => {
  try {
    let postSlug: any = req.query.slug;

    if (postSlug === undefined || postSlug === null || postSlug === "") {
      return res.status(422).end("invalid post slug");
    }

    const query = `SELECT post.id, post.title, post.date, post.content, post.slug, post.category_id,
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
                    WHERE post.data_status = 'active' AND post.slug = ?`;

    const [result] = await dbPool.execute(query, [postSlug]);

    const data = JSON.parse(JSON.stringify(result));

    if (Array.isArray(data) && data.length > 0) {
      res.send(data[0]);
    } else {
      return res.status(404).end("record not found");
    }
  } catch (error) {
    return res.status(500).end(getErrorMsg("500", error));
  }
});

postRouter.get("/next", async (req: Request, res: Response) => {
  try {
    let id: any = req.query.id;

    if (id === undefined || id === null || id === "" || isNaN(Number(id))) {
      return res.status(404).end("invalid id");
    }

    const query = `SELECT title, slug FROM post WHERE id > ? ORDER BY date ASC, id ASC LIMIT 1 OFFSET 0`;

    const [result] = await dbPool.execute(query, [id]);
    const data = JSON.parse(JSON.stringify(result));

    if (Array.isArray(data) && data.length > 0) {
      res.send(data[0]);
    } else {
      res.send({});
    }
  } catch (error) {
    return res.status(500).end(getErrorMsg("500", error));
  }
});

postRouter.get("/previous", async (req: Request, res: Response) => {
  try {
    let id: any = req.query.id;

    if (id === undefined || id === null || id === "" || isNaN(Number(id))) {
      return res.status(404).end("invalid id");
    }

    const query = `SELECT title, slug FROM post WHERE id < ? ORDER BY date DESC, id DESC LIMIT 1 OFFSET 0`;

    const [result] = await dbPool.execute(query, [id]);
    const data = JSON.parse(JSON.stringify(result));

    if (Array.isArray(data) && data.length > 0) {
      res.send(data[0]);
    } else {
      res.send({});
    }
  } catch (error) {
    return res.status(500).end(getErrorMsg("500", error));
  }
});

export default postRouter;
