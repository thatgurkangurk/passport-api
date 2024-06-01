import { users } from "./user";
import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const sessions = pgTable("session", {
  id: varchar("id").notNull().primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});
