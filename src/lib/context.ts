import type { Lucia, Session, User } from "lucia";
import type { Database } from "./db";
import type { DatabaseUserAttributes, initialiseLucia } from "./auth";

type Variables = {
  db: Database;
  user: (User & DatabaseUserAttributes) | null;
  session: Session | null;
  lucia: Lucia<DatabaseUserAttributes>;
};

type AppContext = {
  Variables: Variables;
};

declare module "lucia" {
  interface Register {
    Lucia: ReturnType<typeof initialiseLucia>;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

export type { Variables, AppContext };
