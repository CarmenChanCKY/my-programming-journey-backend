import { auth } from "../src/middleware/auth/auth";
import { getEnvironmentVar } from "../config/env/env";

const email = getEnvironmentVar("CMS_LOGIN_EMAIL", "admin@example.com");
const password = getEnvironmentVar("CMS_LOGIN_PW", "change-me-please");
const name = "Admin";

auth.api
  .signUpEmail({
    body: { email, password, name },
  })
  .then((res) => {
    console.log("Admin account created:", res);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed to create admin account:", err);
    process.exit(1);
  });
