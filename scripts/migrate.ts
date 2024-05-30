import { migrate, getMigrations } from "bun-sqlite-migrations";
import { sqlite } from "../src/lib/db";

migrate(sqlite, getMigrations("./drizzle"));