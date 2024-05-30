import { Database as BunDatabase } from "bun:sqlite";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { schema } from "./schema";
import type { AppContext } from "./context";

import type { Context } from "hono";

const sqlite = new BunDatabase("data/passport.db");

const initialiseDb = (c: Context<AppContext>) => {
  let db = c.get("db");
  if (!db) {
    db = drizzle(sqlite, { schema: schema });
    c.set("db", db);
  }
  return db;
};

type Database = BunSQLiteDatabase<typeof schema>;

export { sqlite, initialiseDb, type Database };
