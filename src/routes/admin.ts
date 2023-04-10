import express, { Request, Response } from "express";
import { validateAdminRegex } from "@/middleware/validator/admin_validate";
import { dbPool } from "config/database/connect";
import {
  generateSalt,
  hashPassword,
  generateJWTToken,
} from "@/modules/admin_module";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import { authenticateJWTToken } from "@/middleware/common_middleware";

const adminRouter = express.Router();

adminRouter.post(
  "/register",
  validateAdminRegex,
  async (req: Request, res: Response) => {
    try {
      const email = req.body.email.trim();
      const plainPW = req.body.password.trim();

      // check email exist
      const searchEmailQuery = `SELECT * FROM admin_data WHERE email = ?`;
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

adminRouter.post(
  "/login",
  validateAdminRegex,
  async (req: Request, res: Response) => {
    try {
      const email = req.body.email.trim();
      const plainPW = req.body.password.trim();

      // check email exist and get the password salt
      const searchQuery = "SELECT salt FROM admin_data WHERE email = ?";
      const [emailResult] = await dbPool.execute(searchQuery, [email]);
      if (Array.isArray(emailResult) && emailResult.length <= 0) {
        return res.status(401).end("email or password not match");
      }

      // check password
      const result = JSON.parse(JSON.stringify(emailResult));
      const salt = result[0].salt;
      const hashPW = hashPassword(plainPW, salt);

      // check password match
      const checkPwQuery =
        "SELECT * FROM admin_data WHERE email = ? AND password = ?";
      const [checkResult] = await dbPool.execute(checkPwQuery, [email, hashPW]);
      if (Array.isArray(checkResult) && checkResult.length <= 0) {
        return res.status(401).end("email or password not match");
      }

      const result2 = JSON.parse(JSON.stringify(checkResult));
      // generate jwt token
      const jwtToken = generateJWTToken({
        id: result2[0].id,
        email: result2[0].email,
      });

      res.send(jwtToken);
    } catch (error) {
      return res.status(500).end("Login Fail");
    }
  }
);

export default adminRouter;
