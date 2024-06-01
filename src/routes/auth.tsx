import { Hono } from "hono";
import type { AppContext } from "../lib/context";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { Notice } from "../components/auth/notice";
import { oauthProviders } from "./api/auth";

const authRoutes = new Hono<AppContext>();

authRoutes.get(
  "/login",
  zValidator(
    "query",
    z.object({ redirect: z.string().url().default("https://gurkz.me") })
  ),
  async (c) => {
    const redirect = new URL(c.req.valid("query").redirect);

    return c.render(
      <>
        <h1 class="text-3xl pb-2">welcome to gurkz Passport</h1>
        <Notice
          title="warning"
          description={`you are signing in to ${redirect.hostname}, make sure that you trust that website!`}
        />
        <br />
        <h2 class="text-2xl">how would you like to sign in?</h2>
        <br />
        <ul class="list-disc list-inside">
          {oauthProviders.map((provider) => (
            <li key={provider}>
              <a
                href={`/api/auth/${provider}?redirect=${redirect.toString()}`}
                class="bg-teal-700 p-2 pt-2 rounded-md"
              >
                sign in with {provider}
              </a>
            </li>
          ))}
        </ul>
      </>
    );
  }
);

export { authRoutes };
