import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { sessions } from "./schema/session";
import { users } from "./schema/user";
import { db } from "./db";
import { Lucia, TimeSpan } from "lucia";
import type { InferSelectModel } from "drizzle-orm";

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionExpiresIn: new TimeSpan(2, "w"),
  sessionCookie: {
    attributes: {
      secure: import.meta.env.PROD,
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

export type DatabaseUserAttributes = InferSelectModel<typeof users>;

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}
