import { NextFunction, Request, Response } from "express";
const codeList = require("@/middleware/error-handler/code_list.json");

const getErrorMsg = (
  code: string,
  description: string = "",
  stack: any = {}
) => {
  let codeData = codeList[code];

  if (codeData === undefined || codeData === null || codeData === "") {
    codeData = codeList["500"];
  }

  return {
    code,
    name: codeData.name,
    description:
      description !== undefined && description !== null && description !== ""
        ? description
        : codeData.description,
    stack,
  };
};

const customErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const code: number = parseInt(err.code) || 500;
  const errorName: string = err.name || codeList["500"].name;
  const description: string = err.description || codeList["500"].description;
  const stack: any = err.stack || {};

  res.status(code).send({
    status: code,
    name: errorName,
    description,
    stack: process.env.NODE_ENV === "development" ? stack : {},
  });
};

export { getErrorMsg, customErrorHandler };
