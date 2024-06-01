import { users } from "./user";
import { pgTable, primaryKey, varchar } from "drizzle-orm/pg-core";

export const oauthAccounts = pgTable(
  "oauth_account",
  {
    provider: varchar("provider").notNull(),
    providerUserId: varchar("provider_user_id").notNull().unique(),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.providerUserId] }),
  })
);
