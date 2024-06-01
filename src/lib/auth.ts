import type { Context } from "hono";
import type { AppContext } from "./context";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { sessions } from "./schema/session";
import { users } from "./schema/user";
import { Lucia, verifyRequestOrigin, type User } from "lucia";
import { eq, type InferSelectModel } from "drizzle-orm";
import { getCookie } from "hono/cookie";

export async function invalidateSession(
  c: Context<AppContext>,
  sessionId: string
) {
  const db = c.get("db");

  try {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    c.header(
      "Set-Cookie",
      c.get("lucia").createBlankSessionCookie().serialize(),
      {
        append: true,
      }
    );
  } catch (err) {
    console.error(`failed to delete session: ${err}`);
  }
}

export function initialiseLucia(c: Context<AppContext>) {
  let lucia = c.get("lucia");
  if (lucia) {
    return lucia;
  }
  const adapter = new DrizzlePostgreSQLAdapter(
    c.get("db") as never,
    sessions,
    users
  );

  lucia = new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: Bun.env.NODE_ENV !== "development",
      },
    },
    getUserAttributes: (attributes) => {
      return {
        id: attributes.id,
        username: attributes.username,
        email: attributes.email,
        profilePictureUrl: attributes.profilePictureUrl,
      };
    },
  });

  c.set("lucia", lucia);
  return lucia;
}

const bypassPaths: string[] = ["/", "/health", "/auth"];

export async function authMiddleware(
  c: Context<AppContext>,
  next: () => Promise<void>
) {
  if (
    c.req.path.startsWith("/api/auth") ||
    c.req.path.startsWith("/auth") ||
    c.req.path.startsWith("/static")
  ) {
    return next();
  }

  const lucia = c.get("lucia");

  const originHeader =
    c.req.header("Origin") ??
    c.req.header("origin") ??
    c.req.header("Access-Control-Allow-Origin");
  const hostHeader = c.req.header("Host") ?? c.req.header("X-Forwarded-Host");

  if (
    (!originHeader ||
      !hostHeader ||
      !verifyRequestOrigin(originHeader, [
        hostHeader,
        Bun.env.VITE_DOMAIN as string,
      ])) &&
    Bun.env.NODE_ENV === "production" &&
    c.req.method !== "GET"
  ) {
    return new Response(null, {
      status: 403,
    });
  }

  const authorisationHeader = c.req.header("Authorization");
  const sessionId =
    lucia.readBearerToken(authorisationHeader ?? "") ??
    `${getCookie(c, lucia.sessionCookieName)}`;

  const { session, user } = await lucia.validateSession(sessionId);
  if (!session && !bypassPaths.includes(c.req.path)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (session?.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    c.header("Set-Cookie", sessionCookie.serialize());
  }
  c.set("user", user as User & DatabaseUserAttributes);
  c.set("session", session);
  await next();
}

export type DatabaseUserAttributes = InferSelectModel<typeof users>;
