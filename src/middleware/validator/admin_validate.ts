import { Request, Response, NextFunction } from "express";
import { validateOrReject } from "class-validator";
import { getErrorMsg } from "@/middleware/error-handler/error_handler";
import AdminData from "@/interface/admin_data";

const validateRegisterRegex = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const content = req.body;

  const validateData = new AdminData();
  validateData.email = content.email.trim();
  validateData.password = content.password.trim();

  try {
    await validateOrReject(validateData, {
      validationError: { target: false },
    });
    next();
  } catch (error) {
    const errorMsg = getErrorMsg("422", error);
    next(errorMsg);
  }
};

export { validateRegisterRegex };
