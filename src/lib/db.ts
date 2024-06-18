import { schema } from "./schema";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";

import postgres from "postgres";

const queryClient = postgres(process.env.DB_URI as string);

const db = drizzle(queryClient, { schema: schema });

type Database = PostgresJsDatabase<typeof schema>;

export { queryClient, db, type Database };
