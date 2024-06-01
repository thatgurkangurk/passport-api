import { nanoid } from "nanoid";
import { users } from "./user";
import { boolean, pgTable, varchar } from "drizzle-orm/pg-core";

export const permissions = pgTable("permission", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  canCreateMusicIds: boolean("can_create_music_ids").notNull().default(false),
  canManageUserIds: boolean("can_manage_music_ids").notNull().default(false),
});
