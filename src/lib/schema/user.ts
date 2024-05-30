import { nanoid } from "nanoid";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { permissions } from "./permission";

export const users = sqliteTable("user", {
  id: text("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => nanoid()),
  username: text("username", {
    length: 32,
  })
    .notNull()
    .unique(),
  email: text("email", {
    length: 128,
  })
    .notNull()
    .unique(),
  permissionsId: text("permissions_id")
    .notNull()
    .references(() => permissions.id),
});

export const usersRelations = relations(users, ({ one }) => ({
  permissions: one(permissions, {
    fields: [users.permissionsId],
    references: [permissions.id],
  }),
}));
