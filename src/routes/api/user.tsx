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

    if (!user) {
      return c.json("unauthorised", 403);
    }

    const permissions = await c.get("db").query.permissions.findFirst({
      where: (p, { eq }) => eq(p.userId, user.id),
      columns: {
        id: false,
        userId: false,
      },
    });

    return c.json({ ...user, permissions: permissions });
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
