import { NextFunction, Request, Response } from "express";
import { getCurrentEnvironment } from "config/env/env";
const codeList = require("@/middleware/error-handler/code_list.json");

const getErrorMsg = (code: string, stack: any) => {
  const codeData = codeList[code];
  return { code, name: codeData.name, description: codeData.description, stack };
};

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const code: number = parseInt(err.code) || 500;
  const errorName: string = err.name || codeList["500"].name;
  const description: string = err.description || codeList["500"].description;
  const stack: any = err.stack || {};
  res.status(code).json({
    status: code,
    name: errorName,
    description,
    stack: getCurrentEnvironment() === "development" ? stack : {},
  });
};

export { getErrorMsg, errorHandler };
