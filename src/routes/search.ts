import express, { Request, Response } from "express";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { removeHTMLTags } from "@/modules/common_module";
import { validateQueryString } from "@/middleware/validator/query_validate";

const searchRouter = express.Router();

searchRouter.get("/post", async (req: Request, res: Response) => {
  try {
    let keyword: any = req.query.keyword;
    let pages: any = req.query.pages;

    let validateKeyword = await validateQueryString({ slug: keyword });

    let validatePage = false;

    if (!isNaN(Number(pages))) {
      pages = parseInt(pages);

      validatePage = await validateQueryString(
        { pages },
        { groups: ["normalPage"] }
      );
    } else {
      let validateEmpty = await validateQueryString(
        { pages },
        { groups: ["firstPage"] }
      );

      if (!validateEmpty) {
        pages = 1;
      }

      validatePage = true;
    }

    if (!validateKeyword || !validatePage) {
      return res.status(404).end("invalid pages");
    }

    const limit: number = 10;
    pages = (parseInt(pages.toString()) - 1) * limit;

    keyword = keyword.toString().trim();

    const startStr = dbPool.escape("\\b" + keyword);
    const middleStr = dbPool.escape("\\b" + keyword + "\\b");
    const endStr = dbPool.escape(keyword + "\\b");

    // query for search title
    const compareTitle = "LOWER(post.title)";
    const titleQuery = `${compareTitle} REGEXP ${startStr} OR ${compareTitle} REGEXP ${endStr} OR ${compareTitle} REGEXP ${middleStr}`;

    // query for search content
    const compareContent =
      "LOWER(REGEXP_REPLACE(post.content, '(<[^>]*>)|(&nbsp;)', ''))";
    const contentQuery = `${compareContent} REGEXP ${startStr} OR ${compareContent} REGEXP ${endStr} OR ${compareContent} REGEXP ${middleStr}`;

    const query = `SELECT post.title, post.date, post.content, post.slug, post.category_id,
                        category.name AS category_name, tag.tags_data
                    FROM post
                    LEFT JOIN category ON category.id = post.category_id AND category.data_status = 'active'
                    LEFT JOIN (SELECT post_tags.post_id, JSON_ARRAYAGG(JSON_OBJECT("id", tags.id, "name", tags.name)) AS tags_data
                        FROM post_tags
                        JOIN tags AS tags
                            ON tags.id = post_tags.tags_id AND tags.data_status = 'active'
                        WHERE post_tags.data_status = 'active'
                        GROUP BY post_tags.post_id) AS tag ON tag.post_id = post.id
                    WHERE post.data_status = 'active'
                    AND (${titleQuery} OR ${contentQuery})
                    ORDER BY post.date DESC , post.id DESC
                    LIMIT ${limit} OFFSET ${pages}`;

    const [result] = await dbPool.execute(query);

    const totalQuery = `SELECT COUNT(post.id) AS post_total
                        FROM post AS post
                        WHERE post.data_status = 'active'
                        AND (${titleQuery} OR ${contentQuery})`;

    const [totalResult] = await dbPool.execute(totalQuery, [keyword, keyword]);

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
      res.send([]);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).end(getErrorMsg("500", error));
  }
});

export default searchRouter;
