import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getEnvironmentVar } from "config/env/env";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";

const authenticateJWTToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    // check request contains verification header
    if (header === undefined || header === null) {
      return res.status(401).send("Unauthorized Request");
    }

    // check request contains token
    const token = header?.split(" ")[1];

    if (token === undefined || token === null || token === "") {
      return res.status(401).send("Invalid Token");
    }

    // check token valid
    const decoded = jwt.verify(token, getEnvironmentVar("JWT_SECRET"));
    next();
  } catch (err) {
    res.status(401).send("Invalid Signature");
  }
  next();
};

export { authenticateJWTToken };
