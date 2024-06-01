import { nanoid } from "nanoid";
import { pgTable, varchar } from "drizzle-orm/pg-core";
import { permissions } from "./permission";
import { relations } from "drizzle-orm";

export const users = pgTable("user", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  username: varchar("username", {
    length: 32,
  })
    .notNull()
    .unique(),
  email: varchar("email", {
    length: 128,
  })
    .notNull()
    .unique(),
  profilePictureUrl: varchar("profile_picture_url").notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
  permissions: one(permissions, {
    fields: [users.id],
    references: [permissions.userId],
  }),
}));
