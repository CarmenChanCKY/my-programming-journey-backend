import express, { NextFunction, Response } from "express";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { validateQueryString } from "@/middleware/validator/query_validate";
import { cmsWriteErrorLog, writeConsoleLog } from "@/modules/logger";
import { SessionRequest } from "supertokens-node/framework/express";
import { validateCategoryFormData } from "@/middleware/validator/categories_validate";

const cmsCategoriesRouter = express.Router();

// get categories list
cmsCategoriesRouter.get(
  "/",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    let pages: any = req.query.pages;
    let filter: any = req.query.filterUsedCount
      ?.toString()
      .toLowerCase()
      .trim();
    let keyword: any = req.query.filterName?.toString().toLowerCase().trim();

    // validate filter if exists
    let validateFilter = false;
    let filterExists = false;
    if (filter !== undefined && filter != null && filter !== "") {
      filterExists = true;
      validateFilter = await validateQueryString({ filter });
      if (validateFilter) {
        // accept the following filter only
        if (!["used", "unused"].includes(filter)) {
          validateFilter = false;
        }
      }
    } else {
      validateFilter = true;
    }

    // validate keyword if exists
    let validateKeyword = false;
    let keywordExists = false;
    if (keyword !== undefined && keyword != null && keyword !== "") {
      keywordExists = true;
      validateKeyword = await validateQueryString({ keyword });
    } else {
      validateKeyword = true;
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

    if (!validateKeyword) {
      next(getErrorMsg("404", "invalid keyword"));
      return;
    }

    const limit: number = 10;
    pages = (parseInt(pages.toString()) - 1) * limit;

    try {
      let filterQuery = "";
      let filterTotalQuery = "";
      const params = [];

      if (filterExists) {
        switch (filter) {
          case "used":
            filterQuery = " HAVING COUNT(post.id) > 0 ";
            filterTotalQuery = " AND category.id IN ";
            break;
          case "unused":
            filterQuery = " HAVING COUNT(post.id) <= 0 ";
            filterTotalQuery = " AND category.id NOT IN ";
            break;
        }

        filterTotalQuery = `${filterTotalQuery} (SELECT DISTINCT post.category_id
            FROM post WHERE post.data_status = 'active') `;
      }

      let keywordQuery = "";
      if (keywordExists) {
        // query for search category name
        keywordQuery = ` AND LOWER(TRIM(category.name)) LIKE ? `;
        params.push(`%${keyword}%`);
      }

      const query = `SELECT category.id, category.name, COUNT(post.id) AS post_count
        FROM category AS category
          LEFT JOIN post AS post ON category.id = post.category_id
            AND post.data_status = 'active'
        WHERE category.data_status = 'active'
         ${keywordQuery}
        GROUP BY category.id
        ${filterQuery}
        ORDER BY category.id DESC
        LIMIT ${limit} OFFSET ${pages};`;

      const [result] = await dbPool.execute(query, params);
      const data = JSON.parse(JSON.stringify(result));

      // calculate total
      const totalQuery = `SELECT COUNT(category.id) AS categories_total
      FROM category AS category
      WHERE category.data_status = 'active' ${keywordQuery} ${filterTotalQuery} ;`;

      const [totalResult] = await dbPool.execute(totalQuery, params);
      const categoriesTotal = JSON.parse(JSON.stringify(totalResult));

      if (
        Array.isArray(data) &&
        Array.isArray(categoriesTotal) &&
        data.length > 0 &&
        categoriesTotal.length > 0
      ) {
        return res.send({ data, total: categoriesTotal[0].categories_total });
      } else {
        return res.send([]);
      }
    } catch (error) {
      writeConsoleLog("error", `CMS Category GET / error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

// get used category id and name
cmsCategoriesRouter.get(
  "/filter-category-list",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    try {
      let filterQuery = " HAVING COUNT(post.id) > 0 ";

      const query = `SELECT category.id, category.name
        FROM category AS category
          LEFT JOIN post AS post ON category.id = post.category_id
            AND post.data_status = 'active'
        WHERE category.data_status = 'active'
        GROUP BY category.id
        ${filterQuery}
        ORDER BY category.name ASC;`;

      const [result] = await dbPool.execute(query, []);
      const data = JSON.parse(JSON.stringify(result));

      if (Array.isArray(data) && data.length > 0) {
        return res.send({ data });
      } else {
        return res.send([]);
      }
    } catch (error) {
      writeConsoleLog(
        "error",
        `CMS Category GET /filter-category-list error.\n${error}`
      );
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

// get category list for post detail
cmsCategoriesRouter.get(
  "/id-name-list",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    try {
      const query = `SELECT category.id, category.name FROM category AS category
        WHERE category.data_status = 'active'
        ORDER BY category.id ASC;`;

      const [result] = await dbPool.execute(query, []);
      const data = JSON.parse(JSON.stringify(result));

      if (Array.isArray(data) && data.length > 0) {
        return res.send({ data });
      } else {
        return res.send([]);
      }
    } catch (error) {
      writeConsoleLog(
        "error",
        `CMS Category GET /id-name-list error.\n${error}`
      );
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

// add new category
cmsCategoriesRouter.post(
  "/add",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    const data = req.body;

    // validate category name is not empty
    let validateData = await validateCategoryFormData(data, "addCategory");

    if (!validateData) {
      next(getErrorMsg("422", "invalid input"));
      return;
    }

    const name = data.name.trim();
    try {
      // check whether the category name is already exist
      const checkQuery = `SELECT id FROM category WHERE LOWER(name) = ? AND data_status='active';`;
      const [checkResult] = await dbPool.execute(checkQuery, [
        name.toLowerCase(),
      ]);
      const checkData = JSON.parse(JSON.stringify(checkResult));

      if (Array.isArray(checkData) && checkData.length > 0) {
        // category exists
        next(getErrorMsg("409", "category exists"));
        return;
      } else {
        const addQuery = `INSERT INTO category (name, data_status) values (?, ?);`;
        const [result] = await dbPool.execute(addQuery, [name, "active"]);
        const resultData = JSON.parse(JSON.stringify(result));

        if (typeof resultData === "object") {
          return res.send({ data: "insert success" });
        } else {
          next(getErrorMsg("500", "insert fail"));
          writeConsoleLog(
            "error",
            `CMS Category POST /add error.\n${JSON.stringify(resultData)}`
          );
          cmsWriteErrorLog("CMS Category POST /add error");
          cmsWriteErrorLog(resultData);
          return;
        }
      }
    } catch (error) {
      writeConsoleLog("error", `CMS Category POST /add error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

// update category
cmsCategoriesRouter.post(
  "/update",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    const data = req.body;

    // validate category name is not empty and id is provided
    let validateData = await validateCategoryFormData(data, "updateCategory");

    if (!validateData) {
      next(getErrorMsg("422", "invalid input"));
      return;
    }

    const name = data.name.trim();
    const id = parseInt(data.id, 10);
    try {
      // check whether the category name is already exist
      const checkQuery = `SELECT id FROM category WHERE LOWER(name) = ? AND data_status='active' and id <> ?;`;
      const [checkResult] = await dbPool.execute(checkQuery, [
        name.toLowerCase(),
        id,
      ]);
      const checkData = JSON.parse(JSON.stringify(checkResult));

      if (Array.isArray(checkData) && checkData.length > 0) {
        // category exists
        next(getErrorMsg("409", "category name exists"));
        return;
      } else {
        const updateQuery = `UPDATE category set name = ? WHERE id = ? and data_status='active';`;
        const [result] = await dbPool.execute(updateQuery, [name, id]);
        const resultData = JSON.parse(JSON.stringify(result));

        if (typeof resultData === "object" && resultData.affectedRows >= 1) {
          return res.send({ data: "update success" });
        } else {
          next(getErrorMsg("500", "update fail"));
          writeConsoleLog(
            "error",
            `CMS Category POST /update error.\n${JSON.stringify(resultData)}`
          );
          cmsWriteErrorLog("CMS Category POST /update error");
          cmsWriteErrorLog(resultData);
          return;
        }
      }
    } catch (error) {
      writeConsoleLog("error", `CMS Category POST /update error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

// delete category
cmsCategoriesRouter.post(
  "/delete",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    const data = req.body;

    // validate category id is valid
    let validateData = await validateCategoryFormData(data, "removeCategory");

    if (!validateData) {
      next(getErrorMsg("422", "invalid input"));
      return;
    }

    const id = parseInt(data.id);

    try {
      // check category id exists
      const checkQuery = `SELECT * FROM category WHERE id = ? AND data_status='active';`;
      const [checkResult] = await dbPool.execute(checkQuery, [id]);
      const checkData = JSON.parse(JSON.stringify(checkResult));

      if (Array.isArray(checkData) && checkData.length > 0) {
        // category exists
        // check whether the category has been used
        const searchQuery = `SELECT id FROM post WHERE category_id = ? AND data_status = 'active';`;
        const [searchResult] = await dbPool.execute(searchQuery, [id]);
        const searchData = JSON.parse(JSON.stringify(searchResult));

        if (Array.isArray(searchData) && searchData.length > 0) {
          // category has been used
          next(getErrorMsg("409", "category has been used"));
          return;
        } else {
          // soft delete the category
          const removeQuery = `UPDATE category set data_status='inactive' WHERE id = ? and data_status='active';`;
          const [result] = await dbPool.execute(removeQuery, [id]);
          const resultData = JSON.parse(JSON.stringify(result));

          if (typeof resultData === "object" && resultData.affectedRows >= 1) {
            return res.send({ data: "remove success" });
          } else {
            next(getErrorMsg("500", "remove fail"));
            writeConsoleLog(
              "error",
              `CMS Category POST /delete error.\n${JSON.stringify(resultData)}`
            );
            cmsWriteErrorLog("CMS Category POST /delete error");
            cmsWriteErrorLog(resultData);
            return;
          }
        }
      } else {
        next(getErrorMsg("409", "category not found"));
        return;
      }
    } catch (error) {
      writeConsoleLog("error", `CMS Category POST /delete error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

export default cmsCategoriesRouter;
