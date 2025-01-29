import express, { NextFunction, Request, Response } from "express";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { removeHTMLTags } from "@/modules/common_module";
import { validateQueryString } from "@/middleware/validator/query_validate";
import { writeConsoleLog } from "@/modules/logger";

const tagsRouter = express.Router();

tagsRouter.get(
  "/all",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = `SELECT tags.id, tags.name, COUNT(post_tags.post_id) AS post_count
                    FROM post_tags AS post_tags
                        JOIN tags AS tags ON tags.id = post_tags.tags_id
                        AND tags.data_status = 'active'
                    WHERE post_tags.data_status = 'active'
                    GROUP BY post_tags.tags_id
                    ORDER BY post_count DESC, tags.id ASC;`;

      const [result] = await dbPool.execute(query);

      const data = JSON.parse(JSON.stringify(result));

      if (Array.isArray(data) && data.length > 0) {
        return res.send({ data });
      } else {
        return res.send([]);
      }
    } catch (error) {
      writeConsoleLog("error", `Tag /all error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

tagsRouter.get(
  "/list",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let tag: any = req.query.tag;
      let pages: any = req.query.pages;

      let validateTag = await validateQueryString({ slug: tag });

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
      } else if (!validateTag) {
        next(getErrorMsg("404", "invalid tag"));
        return;
      }

      const limit: number = 10;
      pages = (parseInt(pages.toString()) - 1) * limit;

      tag = tag.toString().trim();

      const resultData: Array<any> = [];
      let total: number = 0;

      // search for related post
      const searchQuery = `SELECT t1.post_id, JSON_ARRAYAGG(t2.tags_id) AS tags_id_list
                          FROM post_tags AS t1
                            JOIN (SELECT tags.id FROM tags
                              WHERE tags.data_status = 'active'
                              AND LOWER(tags.name) = LOWER(?)) AS search_tags
                            ON search_tags.id = t1.tags_id
                              AND t1.data_status = 'active'
                            JOIN post_tags AS t2 ON t1.post_id = t2.post_id
                              AND t2.data_status = 'active'
                          GROUP BY t1.post_id;`;

      const [searchResult] = await dbPool.execute(searchQuery, [tag]);
      const searchData = JSON.parse(JSON.stringify(searchResult));

      let searchFail = true;

      if (Array.isArray(searchData) && searchData.length > 0) {
        const postIDList: Array<number> = [];
        let tagIDList: Array<number> = [];
        let fillArr: any = [];
        let tagsFillArr: any = [];

        for (let i = 0; i < searchData.length; i++) {
          postIDList.push(searchData[i].post_id);
          tagIDList = tagIDList.concat(searchData[i].tags_id_list);
          fillArr.push("?");
        }

        // remove duplicated tag id
        tagIDList = tagIDList.filter((id: number, index: number) => {
          return tagIDList.indexOf(id) === index;
        });

        for (let i = 0; i < tagIDList.length; i++) {
          tagsFillArr.push("?");
        }

        // get post data
        const postQuery = `SELECT post.id, post.title, post.date, post.content,
                            post.slug, post.category_id, category.name AS category_name
                        FROM post LEFT JOIN category
                          ON category.id = post.category_id
                          AND category.data_status = 'active'
                        WHERE post.data_status = 'active'
                        AND post.id IN (${fillArr.join(",")})
                        ORDER BY post.date DESC , post.id DESC
                        LIMIT ${limit} OFFSET ${pages}`;

        const [postResult] = await dbPool.execute(postQuery, [...postIDList]);
        const postData = JSON.parse(JSON.stringify(postResult));

        // get total
        const totalQuery = `SELECT COUNT(post.id) AS post_total
          FROM post AS post
          WHERE post.data_status = 'active'
            AND post.id IN (${fillArr.join(",")})`;

        const [totalResult] = await dbPool.execute(totalQuery, [...postIDList]);
        const posTotal = JSON.parse(JSON.stringify(totalResult));

        if (
          Array.isArray(postData) &&
          Array.isArray(posTotal) &&
          postData.length > 0 &&
          posTotal.length > 0
        ) {
          // get tag data
          const tagsQuery = `SELECT tags.id, tags.name
                         FROM tags
                          WHERE tags.data_status='active'
                            AND tags.id IN (${tagsFillArr.join(",")})
                         ORDER BY tags.id desc`;

          const [tagsResult] = await dbPool.execute(tagsQuery, [...tagIDList]);
          const tagsData = JSON.parse(JSON.stringify(tagsResult));

          if (Array.isArray(tagsData) && tagsData.length > 0) {
            for (let i = 0; i < postData.length; i++) {
              const filterSearchData = searchData.filter((obj) => {
                return obj.post_id === postData[i].id;
              });

              if (filterSearchData.length > 0) {
                const relatedTags = tagsData.filter((obj) => {
                  return filterSearchData[0].tags_id_list.includes(obj.id);
                });

                if (relatedTags.length > 0) {
                  postData[i].content = removeHTMLTags(postData[i].content);
                  resultData.push({ ...postData[i], tags_data: relatedTags });
                }
              }
            }

            total = posTotal[0].post_total;

            searchFail = false;
          }
        }
      }

      if (searchFail) {
        return res.send([]);
      } else {
        return res.send({ data: resultData, total });
      }
    } catch (error) {
      writeConsoleLog("error", `Tag /list error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

export default tagsRouter;
