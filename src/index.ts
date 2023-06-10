import express, { Express } from "express";
import { getEnvironmentVar } from "config/env/env";
import { errorHandler } from "@/middleware/error-handler/error_handler";

const app: Express = express();
const port = getEnvironmentVar("PORT", 3000);

import adminRouter from "@/routes/admin";
import postRouter from "@/routes/post";
import searchRouter from "@/routes/search";

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/post", postRouter);
app.use("/admin", adminRouter);
app.use("/explore", searchRouter);

// custom error handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
