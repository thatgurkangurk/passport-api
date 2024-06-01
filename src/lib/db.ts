import { schema } from "./schema";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { AppContext } from "./context";

import type { Context } from "hono";
import postgres from "postgres";

const queryClient = postgres(Bun.env.DB_URI as string);

const initialiseDb = (c: Context<AppContext>) => {
  let db = c.get("db");
  if (!db) {
    db = drizzle(queryClient, { schema: schema });
    c.set("db", db);
  }
  return db;
};

type Database = PostgresJsDatabase<typeof schema>;

export { queryClient, initialiseDb, type Database };
