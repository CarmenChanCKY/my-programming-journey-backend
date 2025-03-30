import { validateOrReject } from "class-validator";
import TagsData from "@/interface/tags_data";
import { writeConsoleLog, writeErrorLog } from "@/modules/logger";

const validateTagFormData = async (
  formData: Object,
  group: string
): Promise<boolean> => {
  const validateData: any = new TagsData();

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
    writeErrorLog(`Validate tag form data fail.\n${error}`);
    writeConsoleLog("error", `Validate tag form data fail.\n${error}`);
  }

  return result;
};

export { validateTagFormData };
