import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import Dashboard from "supertokens-node/recipe/dashboard";
import { getEnvironmentVar } from "config/env/env";

const initTokens = () => {
  supertokens.init({
    // debug: true,
    framework: "express",
    supertokens: {
      connectionURI: getEnvironmentVar("CORE_CONNECTION_URL", ""),
      apiKey: getEnvironmentVar("CORE_API_KEY", ""),
    },
    appInfo: {
      // learn more about this on https://supertokens.com/docs/session/appinfo
      appName: "My Programming Journey",
      apiDomain: getEnvironmentVar("AUTH_API_DOMAIN", ""),
      websiteDomain: getEnvironmentVar("AUTH_WEB_DOMAIN", ""),
      apiBasePath: getEnvironmentVar("API_BASE_PATH", ""),
      websiteBasePath: "/",
    },
    recipeList: [
      EmailPassword.init({
        override: {
          apis: (originalImplementation) => {
            return {
              ...originalImplementation,
              signUpPOST: undefined,
            };
          },
        },
      }), // initializes signin / sign up features
      Session.init({
        getTokenTransferMethod: () => "header",
      }), // initializes session features
      Dashboard.init({ admins: [getEnvironmentVar("ADMIN_EMAIL", "")] }), // initialize dashboard
    ],
  });

  return supertokens;
};

export { initTokens };
