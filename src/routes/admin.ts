// create admin
// jwt
// hash
// salt

import express, { NextFunction, Request, Response } from "express";
import { validateRegisterRegex } from "@/middleware/validator/admin_validate";
import { dbPool } from "config/database/connect";
import { generateSalt, hashPassword } from "@/modules/admin_module";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
const adminRouter = express.Router();

adminRouter.post(
  "/register",
  validateRegisterRegex,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = req.body.email.trim();
      const plainPW = req.body.password.trim();

      // check email exist
      const searchEmailQuery = `SELECT * from admin_data WHERE email = ?`;
      const [emailResult] = await dbPool.execute(searchEmailQuery, [email]);
      if (Array.isArray(emailResult) && emailResult.length > 0) {
        return res.status(422).end("email exists");
      }

      // generate password salt
      const salt = generateSalt();
      // hash password
      const hashPW = hashPassword(plainPW, salt);

      const registerQuery = `INSERT INTO admin_data (email, password, salt) VALUES (?, ?, ?)`;
      const [registerUser] = await dbPool.execute(registerQuery, [
        email,
        hashPW,
        salt,
      ]);
      if (Array.isArray(registerUser) && registerUser.length <= 0) {
        return res.status(422).end("register fail");
      }

      res.send(registerUser);
    } catch (error) {
      return res.status(500).end(getErrorMsg("500", error));
    }
  }
);



export default adminRouter;
