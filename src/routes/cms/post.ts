import express, { NextFunction, Response } from "express";
import { dbPool } from "config/database/connect";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { validateQueryString } from "@/middleware/validator/query_validate";
import { cmsWriteErrorLog, writeConsoleLog } from "@/modules/logger";
import { SessionRequest } from "supertokens-node/framework/express";
import { validatePostFormData } from "@/middleware/validator/post_validate";
import { purifyHTML, searchImageFromHTMLStr } from "@/modules/common_module";
import {
  categoryChecker,
  searchImageListExists,
  tagsChecker,
} from "@/modules/post_checker";
import ImageRemover from "@/modules/image_upload/image_remover";

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

// get post by id
cmsPostRouter.get(
  "/detail",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    try {
      let id: any = req.query.id;
      if (!isNaN(Number(id))) {
        id = parseInt(id);
      }

      let validateID = await validateQueryString({ id });

      if (!validateID) {
        next(getErrorMsg("404", "invalid post id"));
        return;
      }

      const postQuery = `SELECT post.* FROM post WHERE post.data_status = 'active' AND post.id = ?`;

      const [postResult] = await dbPool.execute(postQuery, [id]);

      const postData = JSON.parse(JSON.stringify(postResult));

      if (Array.isArray(postData) && postData.length > 0) {
        if (
          postData[0].meta_keyword === undefined ||
          postData[0].meta_keyword === null ||
          postData[0].meta_keyword === ""
        ) {
          if (
            postData[0].tags_postData !== undefined &&
            postData[0].tags_postData !== null &&
            postData[0].tags_postData != ""
          ) {
            postData[0].meta_keyword = postData[0].tags_postData
              .map((obj: any) => {
                return obj.name;
              })
              .join(", ");
          } else {
            postData[0].meta_keyword = "";
          }
        }

        // get post tags
        const tagsQuery = `SELECT id, tags_id FROM post_tags WHERE post_id = ? AND data_status = 'active'`;
        const [tagsResult] = await dbPool.execute(tagsQuery, [id]);
        const tagsData = JSON.parse(JSON.stringify(tagsResult));

        // get post reference
        const postRefQuery = `SELECT id, name, hyperlink FROM post_reference WHERE post_id = ? AND data_status = 'active'`;
        const [postRefResult] = await dbPool.execute(postRefQuery, [id]);
        const postRefData = JSON.parse(JSON.stringify(postRefResult));

        res.send({
          post_data: postData[0],
          tags_data: tagsData,
          post_reference: postRefData,
        });
      } else {
        next(getErrorMsg("404", "post not found"));
        return;
      }
    } catch (error) {
      writeConsoleLog("error", `CMS Post /detail error.\n${error}`);
      next(getErrorMsg("500", "", error));
      return;
    }
  }
);

// insert new post
cmsPostRouter.post(
  "/add",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    //TODO:
    const data = req.body;

    // validate post data
    let validateData = await validatePostFormData(data, "addPost");

    if (!validateData) {
      next(getErrorMsg("422", "invalid input"));
      return;
    }
  }
);

// update post
cmsPostRouter.post(
  "/update",
  async (req: SessionRequest, res: Response, next: NextFunction) => {
    const data = req.body;

    // validate post data
    let validateData = await validatePostFormData(data, "updatePost");

    if (!validateData) {
      next(getErrorMsg("422", "invalid input"));
      return;
    }

    const id = parseInt(data.id, 10);

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      // check post id exists
      const checkPostQuery = `SELECT id FROM post WHERE id = ? AND data_status = 'active';`;
      const [checkResult] = await conn.execute(checkPostQuery, [id]);
      const checkPostData = JSON.parse(JSON.stringify(checkResult));
      if (!(Array.isArray(checkPostData) && checkPostData.length > 0)) {
        // post not found
        next(getErrorMsg("409", "post not found"));
        return;
      }

      // check category id exists (if any)
      if (data.category_id !== undefined && data.category_id !== null) {
        const { result, msg } = await categoryChecker(conn, data.category_id);

        if (!result) {
          // category not found
          next(msg);
          return;
        }
      }

      // check tags id exists (if any)
      if (
        data.tags_id_list !== undefined &&
        data.tags_id_list !== null &&
        data.tags_id_list.length > 0
      ) {
        const { result, msg } = await tagsChecker(conn, data.tags_id_list);
        if (!result) {
          // tags not found
          next(msg);
          return;
        }
      }

      // check post content
      let updateFileList: Array<{
        id: number;
        fileID: string;
      }> = [];
      let removeFileList: Array<{ id: number; fileID: string }> = [];
      if (data.content !== undefined && data.content !== null) {
        data.content = purifyHTML(data.content);

        // get image inside content
        const imageList = searchImageFromHTMLStr(data.content);
        if (imageList.length > 0) {
          const { result, msg, updateList, removeList, notFoundList } =
            await searchImageListExists(conn, imageList, id);
          if (!result) {
            next(getErrorMsg("422", msg, notFoundList));
            return;
          } else {
            updateFileList = updateList;
            removeFileList = removeList;
          }
        }
      }

      // update post data
      const allowedFields = [
        "title",
        "date",
        "content",
        "slug",
        "category_id",
        "meta_description",
        "meta_keyword",
      ];

      const setClauses: string[] = [];
      const values: any[] = [];
      allowedFields.forEach((field) => {
        if (
          Object.prototype.hasOwnProperty.call(data, field) &&
          data[field] !== undefined
        ) {
          setClauses.push(`${field} = ?`);
          values.push(data[field]);
        }
      });

      if (setClauses.length === 0) {
        // nothing to update
        next(getErrorMsg("422", "no updatable fields provided"));
        return;
      }

      const updatePostQuery = `UPDATE post SET ${setClauses.join(
        ", "
      )} WHERE id = ? AND data_status = 'active'`;

      const [queryResult] = await conn.execute(updatePostQuery, [
        ...values,
        id,
      ]);
      const postResultData = JSON.parse(JSON.stringify(queryResult));

      if (
        !(
          typeof postResultData === "object" && postResultData.affectedRows >= 1
        )
      ) {
        writeConsoleLog(
          "error",
          `CMS Post POST /update error. update post data fail.\n${JSON.stringify(
            postResultData
          )}`
        );
        cmsWriteErrorLog("CMS Post POST /update error. update post data fail");
        cmsWriteErrorLog(postResultData);
        conn.rollback();
        next(getErrorMsg("500", "update post data fail"));
        return;
      }

      // insert / update / remove tags data
      if (
        data.tags_id_list !== undefined &&
        data.tags_id_list !== null &&
        data.tags_id_list.length > 0
      ) {
        // find the existing tags in post_tags table
        const searchTagsQuery = `SELECT id, post_id, tags_id FROM post_tags WHERE post_id = ? AND data_status = 'active';`;
        const [dbTagsResult] = await conn.execute(searchTagsQuery, [id]);
        let dbTagsData = JSON.parse(JSON.stringify(dbTagsResult));

        let insertData: Array<any> = [];
        const updateData: Array<any> = [];
        let removeData: Array<any> = [];

        if (Array.isArray(dbTagsData) && dbTagsData.length > 0) {
          // find out the intersection
          const dbSet = new Set(
            dbTagsData.map((obj) => {
              return obj.tags_id;
            })
          );
          const intersection = [...new Set(data.tags_id_list)].filter((v) => {
            return dbSet.has(v);
          });

          data.tags_id_list = data.tags_id_list.filter((id: number) => {
            return !intersection.includes(id);
          });

          dbTagsData = dbTagsData.filter((obj) => {
            return !intersection.includes(obj.tags_id);
          });

          if (dbTagsData.length > 0) {
            for (let i = 0; i < data.tags_id_list.length; i++) {
              if (i + 1 > dbTagsData.length) {
                insertData.push(data.tags_id_list[i]);
              } else {
                updateData.push({
                  ...dbTagsData[i],
                  tags_id: data.tags_id_list[i],
                });

                dbTagsData.splice(i, 1);
              }
            }
          } else {
            insertData = data.tags_id_list;
          }

          removeData = dbTagsData
            .filter((obj: any) => {
              return (
                updateData.findIndex((o): any => {
                  return o.tags_id === obj.tags_id;
                }) === -1 && !insertData.includes(obj.tags_id)
              );
            })
            .map((obj: any) => {
              return obj.tags_id;
            });
        } else {
          insertData = data.tags_id_list;
        }

        if (insertData.length > 0) {
          const values: any[] = [];
          insertData.forEach((tagsId: number) => {
            values.push(id, tagsId);
          });

          const insertTagsQuery = `INSERT INTO post_tags (post_id, tags_id) VALUES ${insertData
            .map(() => "(?, ?)")
            .join(", ")};`;
          const [insertResult] = await conn.execute(insertTagsQuery, values);
          const insertRes = JSON.parse(JSON.stringify(insertResult));
          if (!(typeof insertRes === "object" && insertRes.affectedRows >= 1)) {
            writeConsoleLog(
              "error",
              `CMS Post POST /update error. insert tags data fail. \n${JSON.stringify(
                insertRes
              )}`
            );
            cmsWriteErrorLog(
              "CMS Post POST /update error. insert tags data fail"
            );
            cmsWriteErrorLog(insertRes);
            conn.rollback();
            next(getErrorMsg("500", "insert tags data fail"));
            return;
          }
        }

        if (updateData.length > 0) {
          for (let i = 0; i < updateData.length; i++) {
            const updateTagsQuery =
              "UPDATE post_tags SET tags_id = ? WHERE id = ?;";

            const [queryResult] = await conn.execute(updateTagsQuery, [
              updateData[i].tags_id,
              id,
            ]);
            const tagsResultData = JSON.parse(JSON.stringify(queryResult));

            if (
              !(
                typeof tagsResultData === "object" &&
                tagsResultData.affectedRows >= 1
              )
            ) {
              writeConsoleLog(
                "error",
                `CMS Post POST /update error. update tags data fail.\n${JSON.stringify(
                  tagsResultData
                )}`
              );
              cmsWriteErrorLog(
                "CMS Post POST /update error. update tags data fail"
              );
              cmsWriteErrorLog(tagsResultData);
              conn.rollback();
              next(getErrorMsg("500", "update tags data fail"));
              return;
            }
          }
        }

        if (removeData.length > 0) {
          const removeTagsQuery = `UPDATE post_tags SET data_status = 'inactive' WHERE id IN (${removeData
            .map((v) => {
              return "?";
            })
            .join(",")});`;
          const [result] = await conn.execute(removeTagsQuery, [...removeData]);
          const deleteTagsData = JSON.parse(JSON.stringify(result));

          if (!(Array.isArray(deleteTagsData) && deleteTagsData.length > 0)) {
            writeConsoleLog(
              "error",
              `CMS Post POST /update error. remove tags data fail.\n${JSON.stringify(
                deleteTagsData
              )}`
            );
            cmsWriteErrorLog(
              "CMS Post POST /update error. remove tags data fail"
            );
            cmsWriteErrorLog(deleteTagsData);
            conn.rollback();
            next(getErrorMsg("500", "remove tags data fail"));
            return;
          }
        }
      }

      // insert / remove post reference
      if (
        data.post_reference !== undefined &&
        data.post_reference !== null &&
        data.post_reference.length > 0
      ) {
        // find the existing post reference
        const searchPostRefQuery = `SELECT id, post_id, name, hyperlink FROM post_reference WHERE post_id = ? AND data_status = 'active';`;
        const [dbPostRefsResult] = await conn.execute(searchPostRefQuery, [id]);
        let dbPostRefData = JSON.parse(JSON.stringify(dbPostRefsResult));

        let insertData: Array<any> = [];
        let removeData: Array<any> = [];

        if (Array.isArray(dbPostRefData) && dbPostRefData.length > 0) {
          for (let i = 0; i < data.post_reference; i++) {
            const postRef = data.post_reference[i];

            const searchIndex = dbPostRefData.findIndex((obj: any) => {
              return (
                obj.name === postRef.name && obj.hyperlink === postRef.hyperlink
              );
            });

            if (searchIndex !== -1) {
              dbPostRefData.splice(searchIndex, 1);
              continue;
            }

            insertData.push(postRef);
          }

          if (dbPostRefData.length > 0) {
            removeData = dbPostRefData.map((obj: any) => {
              return obj.id;
            });
          }
        } else {
          insertData = data.post_reference;
        }

        if (insertData.length > 0) {
          const values: any[] = [];
          insertData.forEach((refData: any) => {
            values.push(id, refData.name, refData.hyperlink);
          });

          const insertPostRefQuery = `INSERT INTO post_reference (post_id, name, hyperlink) VALUES ${insertData
            .map(() => "(?, ?, ?)")
            .join(", ")};`;
          const [insertResult] = await conn.execute(insertPostRefQuery, values);
          const insertRes = JSON.parse(JSON.stringify(insertResult));
          if (!(typeof insertRes === "object" && insertRes.affectedRows >= 1)) {
            writeConsoleLog(
              "error",
              `CMS Post POST /update error. insert post ref data fail. \n${JSON.stringify(
                insertRes
              )}`
            );
            cmsWriteErrorLog(
              "CMS Post POST /update error. insert post ref data fail"
            );
            cmsWriteErrorLog(insertRes);
            conn.rollback();
            next(getErrorMsg("500", "insert post ref data fail"));
            return;
          }
        }

        if (removeData.length > 0) {
          const removePostRefQuery = `UPDATE post_reference SET data_status = 'inactive' WHERE id IN (${removeData
            .map((v) => {
              return "?";
            })
            .join(",")});`;
          const [result] = await conn.execute(removePostRefQuery, [
            ...removeData,
          ]);
          const deletePostRefData = JSON.parse(JSON.stringify(result));

          if (
            !(Array.isArray(deletePostRefData) && deletePostRefData.length > 0)
          ) {
            writeConsoleLog(
              "error",
              `CMS Post POST /update error. remove post ref data fail.\n${JSON.stringify(
                deletePostRefData
              )}`
            );
            cmsWriteErrorLog(
              "CMS Post POST /update error. remove post ref data fail"
            );
            cmsWriteErrorLog(deletePostRefData);
            conn.rollback();
            next(getErrorMsg("500", "remove post ref data fail"));
            return;
          }
        }
      }

      // update image_store
      if (updateFileList.length > 0) {
        const updateImgQuery = `UPDATE image_stores SET post_id = ? WHERE id IN (${updateFileList
          .map((v) => {
            return "?";
          })
          .join(",")});`;

        const [queryResult] = await conn.execute(updateImgQuery, [
          id,
          ...updateFileList.map((obj) => {
            return obj.id;
          }),
        ]);
        const updateImgResultData = JSON.parse(JSON.stringify(queryResult));

        if (
          !(
            typeof updateImgResultData === "object" &&
            updateImgResultData.affectedRows >= 1
          )
        ) {
          writeConsoleLog(
            "error",
            `CMS Post POST /update error. update post image data fail.\n${JSON.stringify(
              updateImgResultData
            )}`
          );
          cmsWriteErrorLog(
            "CMS Post POST /update error. update post image data fail"
          );
          cmsWriteErrorLog(updateImgResultData);
          conn.rollback();
          next(getErrorMsg("500", "update post image data fail"));
          return;
        }
      }

      // remove image store
      if (removeFileList.length > 0) {
        const removeImgQuery = `DELETE FROM image_stores WHERE id IN (${removeFileList
          .map((v) => {
            return "?";
          })
          .join(",")});`;

        const [queryResult] = await conn.execute(
          removeImgQuery,
          removeFileList.map((obj) => {
            return obj.id;
          })
        );
        const removeImgResultData = JSON.parse(JSON.stringify(queryResult));

        if (
          !(
            typeof removeImgResultData === "object" &&
            removeImgResultData.affectedRows >= 1
          )
        ) {
          writeConsoleLog(
            "error",
            `CMS Post POST /update error. remove post image data fail.\n${JSON.stringify(
              removeImgResultData
            )}`
          );
          cmsWriteErrorLog(
            "CMS Post POST /update error. remove post image data fail"
          );
          cmsWriteErrorLog(removeImgResultData);
          conn.rollback();
          next(getErrorMsg("500", "remove post image data fail"));
          return;
        }

        // remove file from google drive
        for (let i = 0; i < removeFileList.length; i++) {
          const { success, data, type } = await ImageRemover(
            removeFileList[i].fileID
          );
          if (!success) {
            if (type === "redirect") {
              conn.rollback();
              return res.send(data);
            } else {
              // log only
              // keep the process going
              writeConsoleLog(
                "error",
                `CMS Post POST /update error. remove post image data fail.\n${JSON.stringify(
                  data
                )}`
              );
              cmsWriteErrorLog(data);
            }
          }
        }
      }

      conn.commit();

      return res.send({ data: "update success" });
    } catch (error) {
      writeConsoleLog("error", `CMS Post POST /update error.\n${error}`);
      conn.rollback();
      next(getErrorMsg("500", "", error));
      return;
    } finally {
      if (conn) {
        conn.release();
      }
    }
  }
);

// delete post
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
      const checkQuery = `SELECT id FROM post WHERE id = ? AND data_status = 'active';`;
      const [checkResult] = await conn.execute(checkQuery, [id]);
      const checkData = JSON.parse(JSON.stringify(checkResult));

      if (Array.isArray(checkData) && checkData.length > 0) {
        // soft delete from post_tags
        const removePostTagsQuery = `UPDATE post_tags SET data_status = 'inactive' WHERE post_id = ? AND data_status = 'active';`;
        const [removePostTagsResult] = await conn.execute(removePostTagsQuery, [
          id,
        ]);
        const removePostTagsData = JSON.parse(
          JSON.stringify(removePostTagsResult)
        );

        // soft delete from post_reference
        const removePostRefQuery = `UPDATE post_reference SET data_status = 'inactive' WHERE post_id = ? AND data_status = 'active';`;
        const [removePostRefResult] = await conn.execute(removePostRefQuery, [
          id,
        ]);
        const removePostRefData = JSON.parse(
          JSON.stringify(removePostRefResult)
        );

        // soft delete the post
        const removeQuery = `UPDATE post SET data_status = 'inactive' WHERE id = ? and data_status = 'active';`;
        const [result] = await conn.execute(removeQuery, [id]);
        const deletePostData = JSON.parse(JSON.stringify(result));

        conn.commit();

        if (
          typeof removePostTagsData === "object" &&
          typeof deletePostData === "object" &&
          typeof removePostRefData === "object" &&
          removePostTagsData.affectedRows >= 1 &&
          deletePostData.affectedRows >= 1 &&
          removePostRefData.affectedRows >= 1
        ) {
          return res.send({ data: "remove success" });
        } else {
          writeConsoleLog(
            "error",
            `CMS Post POST /delete error.\n removePostTagsData: ${JSON.stringify(
              removePostTagsData
            )} \n deletePostData: ${JSON.stringify(
              deletePostData
            )} \n removePostRefData: ${JSON.stringify(removePostRefData)}`
          );
          cmsWriteErrorLog("CMS Post POST /delete error");
          cmsWriteErrorLog(removePostTagsData);
          cmsWriteErrorLog(deletePostData);
          cmsWriteErrorLog(removePostRefData);
          next(getErrorMsg("500", "remove fail"));
          conn.rollback();
          return;
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
