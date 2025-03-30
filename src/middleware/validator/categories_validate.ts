import { validateOrReject } from "class-validator";
import CategoriesData from "@/interface/categories_data";
import { writeConsoleLog, writeErrorLog } from "@/modules/logger";

const validateCategoryFormData = async (
  formData: Object,
  group: string
): Promise<boolean> => {
  const validateData: any = new CategoriesData();

  for (const [key, val] of Object.entries(formData)) {
    validateData[key] = val;
  }

  let result: boolean = false;

  let options = {
    validationError: { target: false },
    groups: [group],
  };

  try {
    await validateOrReject(validateData, options);
    result = true;
  } catch (error) {
    writeErrorLog(`Validate category form data fail.\n${error}`);
    writeConsoleLog("error", `Validate category form data fail.\n${error}`);
  }

  return result;
};

export { validateCategoryFormData };
