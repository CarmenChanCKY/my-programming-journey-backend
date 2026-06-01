import { validateOrReject } from "class-validator";
import { plainToInstance } from "class-transformer";
import PostData from "@/interface/post_data";
import { writeConsoleLog, writeErrorLog } from "@/modules/logger";

const validatePostFormData = async (
  formData: Object,
  group: string
): Promise<boolean> => {
  const validateData = plainToInstance(PostData, formData, {
    enableImplicitConversion: true,
  });

  let result: boolean = false;

  let options = {
    validationError: { target: false },
    groups: [group],
  };

  try {
    await validateOrReject(validateData, options);
    result = true;
  } catch (error) {
    writeErrorLog(`Validate post form data fail.\n${error}`);
    writeConsoleLog("error", `Validate post form data fail.\n${error}`);
  }

  return result;
};

export { validatePostFormData };
