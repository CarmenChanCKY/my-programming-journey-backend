import { validateOrReject } from "class-validator";
import QueryStringData from "@/interface/query_string";
import { writeConsoleLog, writeErrorLog } from "@/modules/logger";

const validateQueryString = async (
  queryObject: Object,
  customOptions: Object = {}
): Promise<boolean> => {
  const validateData: any = new QueryStringData();

  for (const [key, val] of Object.entries(queryObject)) {
    validateData[key] = val;
  }

  let result: boolean = false;

  let options = {
    validationError: { target: false },
  };

  if (Object.keys(customOptions).length > 0) {
    Object.assign(options, customOptions);
  }

  try {
    await validateOrReject(validateData, options);
    result = true;
  } catch (error) {
    writeErrorLog(`Validate query string fail.\n${error}`);
    writeConsoleLog("error", `Validate admin regex fail.\n${error}`);
  }

  return result;
};

export { validateQueryString };
