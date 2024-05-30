import type { Database } from "./db";

type Variables = {
  db: Database;
};

type AppContext = {
  Variables: Variables;
};

export type { Variables, AppContext };
