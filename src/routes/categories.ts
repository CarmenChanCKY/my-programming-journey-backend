import express, { NextFunction, Request, Response } from "express";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";

const categoriesRouter = express.Router();

categoriesRouter.get("/all", async (req: Request, res: Response) => {
  try {
    const query = `SELECT post.title, post.date, post.category_id, post.slug
                   FROM post
                   JOIN category ON category.id = post.category_id
                        AND category.data_status = 'active'
                   WHERE post.data_status = 'active'
                   ORDER BY post.date DESC , post.id DESC`;

    const [result] = await dbPool.execute(query);

    const groupQuery = `SELECT category.id, category.name as category_name, COUNT(post.id) as post_count
                        FROM post
                        JOIN category ON category.id = post.category_id
                             AND category.data_status = 'active'
                        WHERE post.data_status = 'active'
                        GROUP BY category.id
                        HAVING COUNT(post.id) > 0
                        ORDER BY category_id ASC`;

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
          name: groupData[i].category_name,
          list,
        });
      }

      res.send({ postList: resultData, categoryList: groupData });
    } else {
      res.send([]);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).end(getErrorMsg("500", error));
  }
});

export default categoriesRouter;
