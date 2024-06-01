import { Hono } from "hono";
import type { AppContext } from "../../lib/context";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getCookie, setCookie } from "hono/cookie";
import { generateState } from "arctic";
import {
  createDiscordSession,
  getDiscordAuthorisationUrl,
} from "../../lib/auth/discord";
import { users } from "../../lib/schema/user";
import { eq } from "drizzle-orm";
import { invalidateSession } from "../../lib/auth";
import {
  createGithubSession,
  getGithubAuthorisationUrl,
} from "../../lib/auth/github";

const authApiRoutes = new Hono<AppContext>();

export const oauthProviders = ["discord", "github"] as const;
const providersSchema = z.enum(oauthProviders);

authApiRoutes
  .get(
    "/logout",
    zValidator("query", z.object({ redirect: z.string().url().optional() })),
    async (c) => {
      const redirect = c.req.valid("query").redirect;
      const lucia = c.get("lucia");
      const authorisationHeader = c.req.header("Authorization");
      const sessionId =
        lucia.readBearerToken(authorisationHeader ?? "") ??
        getCookie(c, lucia.sessionCookieName);
      if (!sessionId) {
        return c.json({ error: "Not logged in" }, 400);
      }
      const { session } = await lucia.validateSession(sessionId);
      if (!session) {
        return c.json({ error: "Not logged in" }, 400);
      }

      await invalidateSession(c, sessionId);
      if (redirect) return c.redirect(redirect);
      return c.json(null, 200);
    }
  )
  .get("/providers", async (c) => {
    await c.get("db").delete(users).where(eq(users.email, "hello@gurkz.me"));
    return c.json({ providers: oauthProviders });
  })
  .get(
    "/login",
    zValidator("query", z.object({ redirect: z.string().url() })),
    async (c) => {
      const redirect = new URL(c.req.valid("query").redirect);

      console.log(redirect.hostname);

      return c.html(
        <html lang="en">
          <body>
            <h1>welcome to passport!</h1>
            <p>
              after you sign in, you will be redirected to {redirect.hostname},
              please make sure that is the website you want to sign in to
            </p>
          </body>
        </html>
      );
    }
  )
  .get(
    "/:provider",
    zValidator("param", z.object({ provider: providersSchema })),
    zValidator(
      "query",
      z
        .object({
          redirect: z.string().url().default("http://localhost:3000"),
          sessionToken: z.string().optional(),
        })
        .default({ redirect: "http://localhost:3000" })
    ),
    async (c) => {
      const provider = c.req.valid("param").provider;
      const redirect = c.req.valid("query").redirect;
      console.log(redirect);
      const sessionToken = c.req.valid("query").sessionToken;
      setCookie(c, "redirect", redirect, {
        httpOnly: true,
        maxAge: 60 * 10,
        path: "/",
        secure: Bun.env.NODE_ENV === "production",
      });

      if (sessionToken) {
        const session = await c.get("lucia").validateSession(sessionToken);
        if (session.user) {
          setCookie(c, "sessionToken", sessionToken, {
            httpOnly: true,
            maxAge: 60 * 10, // 10 minutes
            path: "/",
            secure: Bun.env.NODE_ENV === "production",
          });
        }
      }
      const state = generateState();
      switch (provider) {
        case "discord": {
          const url = await getDiscordAuthorisationUrl({ c, state });
          setCookie(c, "discord_oauth_state", state, {
            httpOnly: true,
            maxAge: 60 * 10,
            path: "/",
            secure: Bun.env.NODE_ENV === "production",
          });
          return c.redirect(url.toString());
        }
        case "github": {
          const url = await getGithubAuthorisationUrl({ c, state });
          setCookie(c, "github_oauth_state", state, {
            httpOnly: true,
            maxAge: 60 * 10,
            path: "&",
            secure: Bun.env.NODE_ENV === "production",
          });
          return c.redirect(url.toString());
        }
      }
    }
  )
  .all(
    "/:provider/callback",
    zValidator("param", z.object({ provider: providersSchema })),
    async (c) => {
      try {
        const provider = c.req.valid("param").provider;
        let stateCookie = getCookie(c, `${provider}_oauth_state`);
        const codeVerifierCookie = getCookie(
          c,
          `${provider}_oauth_code_verifier`
        );
        const sessionTokenCookie = getCookie(c, "sessionToken");
        let redirect = getCookie(c, "redirect");
        console.log(redirect);

        const url = new URL(c.req.url);
        let state = url.searchParams.get("state");
        let code = url.searchParams.get("code");
        const codeVerifierRequired = ["google"].includes(provider); //? not really needed, but if I ever add google login
        if (c.req.method === "POST") {
          const formData = await c.req.formData();
          state = formData.get("state") as string;
          stateCookie = state ?? stateCookie;
          code = formData.get("code") as string;
          redirect = Bun.env.VITE_DOMAIN;
        }
        if (
          !state ||
          !stateCookie ||
          !code ||
          stateCookie !== state ||
          !redirect ||
          (codeVerifierRequired && !codeVerifierCookie)
        ) {
          console.log(state);
          console.log(stateCookie);
          return c.json({ error: "Invalid request" }, 400);
        }

        switch (provider) {
          case "discord": {
            const session = await createDiscordSession({
              c,
              idToken: code,
              sessionToken: sessionTokenCookie,
            });
            if (!session) {
              return c.json({}, 400);
            }
            if (session?.fresh) {
              const sessionCookie = c
                .get("lucia")
                .createSessionCookie(session.id);
              c.header("Set-Cookie", sessionCookie.serialize());
            }
            const redirectUrl = new URL(redirect);
            redirectUrl.searchParams.append("token", session.id);
            return c.redirect(redirectUrl.toString());
          }
          case "github": {
            const session = await createGithubSession({
              c,
              idToken: code,
              sessionToken: sessionTokenCookie,
            });
            if (!session) {
              return c.json({}, 400);
            }
            if (session?.fresh) {
              const sessionCookie = c
                .get("lucia")
                .createSessionCookie(session.id);
              c.header("Set-Cookie", sessionCookie.serialize());
            }
            const redirectUrl = new URL(redirect);
            redirectUrl.searchParams.append("token", session.id);
            return c.redirect(redirectUrl.toString());
          }
          default: {
            return c.json({ message: "invalid provider" }, 400);
          }
        }
      } catch (err) {
        console.error(err);
        if (err instanceof Error) {
          console.error(err.stack);
        }
      }
    }
  );

export { authApiRoutes };
