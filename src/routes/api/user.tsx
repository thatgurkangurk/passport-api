import { type Context, Hono } from "hono";
import type { AppContext } from "../../lib/context";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const userApiRoutes = new Hono<AppContext>();

export async function getOAuthAccounts(
  c: Context<AppContext>
): Promise<{ provider: string }[]> {
  const oauthAccounts = await c.get("db").query.oauthAccounts.findMany({
    where: (u, { eq }) => eq(u.userId, c.get("user")?.id ?? ""),
  });
  return oauthAccounts.map((oa) => ({
    provider: oa.provider,
  }));
}

userApiRoutes
  .get("/@me", async (c) => {
    const user = c.get("user");
    return c.json(user);
  })
  .get("/oauth-accounts", async (c) => {})
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().length(21, {
          message: "not a valid user id",
        }),
      })
    ),
    async (c) => {
      const id = c.req.valid("param").id;

      const user = await c.get("db").query.users.findFirst({
        where: (u, { eq }) => eq(u.id, id),
        columns: {
          email: false,
        },
      });

      if (!user) {
        return c.json({ message: "Not found." }, 404);
      }

      return c.json(user);
    }
  );

export { userApiRoutes };
