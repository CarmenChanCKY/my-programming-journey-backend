import { PoolConnection } from "mysql2/promise";

const insertPostReference = async (conn: PoolConnection, postID: number, insertData: any[]) => {
    const values: any[] = [];
    insertData.forEach((refData: any) => {
        values.push(postID, refData.name, refData.hyperlink);
    });

    const insertPostRefQuery = `INSERT INTO post_reference (post_id, name, hyperlink) VALUES ${insertData
        .map(() => "(?, ?, ?)")
        .join(", ")};`;
    const [insertResult] = await conn.execute(insertPostRefQuery, values);
    const insertRes = JSON.parse(JSON.stringify(insertResult));

    return { success: typeof insertRes === "object" && insertRes.affectedRows >= 1, insertRes }
}

export { insertPostReference }