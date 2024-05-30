import { Hono } from "hono";
import type { AppContext } from "./lib/context";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { initialiseDb } from "./lib/db";

const app = new Hono<AppContext>();
app
  .use(logger())
  .use(cors())
  .use((c, next) => {
    initialiseDb(c);
    return next();
  })
  .get("/health", async (c) => {
    return c.json({ status: "ok" });
  })
  .get("/", (c) => c.text("welcome to passport"));

export default {
  port: 3000,
  fetch: app.fetch,
};
