import { Hono } from "hono";
import type { AppContext } from "./lib/context";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { initialiseDb } from "./lib/db";
import { authMiddleware, initialiseLucia } from "./lib/auth";
import { customLogger } from "./lib/log";
import { authApiRoutes } from "./routes/api/auth";
import { userApiRoutes } from "./routes/api/user";
import { csrf } from "hono/csrf";
import { userRoutes } from "./routes/user";
import { authRoutes } from "./routes/auth";
import { serveStatic } from "hono/bun";
import { renderer } from "./lib/renderer";

const app = new Hono<AppContext>();
app
  .use(logger(customLogger))
  .use(cors())
  .use(csrf())
  .get("*", renderer)
  .get(
    "/static/*",
    serveStatic({
      root: "./",
      rewriteRequestPath: (path) => path.replace(/^\/static/, "/static"),
      onNotFound: (path, c) => {
        console.log(`${path} is not found, you access ${c.req.path}`);
      },
    })
  )
  .use((c, next) => {
    initialiseDb(c);
    initialiseLucia(c);

    return next();
  })
  .use(authMiddleware)
  .get("/health", async (c) => {
    return c.json({ status: "ok" });
  })
  .get(
    "/",

    async (c) => {
      const session = c.get("session");
      const user = c.get("user");

      return c.render(
        <>
          <h1 class="text-3xl pb-2">welcome to gurkz Passport</h1>
          {user && session ? (
            <>
              <h2 class="text-2xl pb-2">welcome back, {user.username}!</h2>
              <div class="flex flex-row gap-3">
                <a href="/user" class="bg-teal-700 p-2 pt-2 rounded-md">
                  user settings
                </a>
                <a
                  href={`/api/auth/logout?redirect=${
                    import.meta.env.VITE_DOMAIN
                  }`}
                  class="bg-red-700 p-2 pt-2 rounded-md"
                >
                  log out
                </a>
              </div>
            </>
          ) : (
            <a
              href={`/auth/login?redirect=${import.meta.env.VITE_DOMAIN}/user`}
              class="bg-green-700 p-2 pt-2 rounded-md"
            >
              log in
            </a>
          )}
        </>
      );
    }
  );

const routes = app
  .route("/api/auth", authApiRoutes)
  .route("/auth", authRoutes)
  .route("/api/user", userApiRoutes)
  .route("/user", userRoutes);

export type AppType = typeof routes;

console.log("passport has now started");

export default app;
