import { PoolConnection } from "mysql2/promise";

const insertPostTags = async (conn: PoolConnection, postID: number, insertData: any[]) => {
    const values: any[] = [];
    insertData.forEach((tagsId: number) => {
        values.push(postID, tagsId);
    });

    const insertTagsQuery = `INSERT INTO post_tags (post_id, tags_id) VALUES ${insertData
        .map(() => "(?, ?)")
        .join(", ")};`;
    const [insertResult] = await conn.execute(insertTagsQuery, values);
    const insertRes = JSON.parse(JSON.stringify(insertResult));

    return { success: typeof insertRes === "object" && insertRes.affectedRows >= 1, insertRes }
}

export { insertPostTags }