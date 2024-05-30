import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const permissions = sqliteTable("permission", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid()),
  canCreateMusicIds: integer("can_create_music_ids", { mode: "boolean" })
    .notNull()
    .default(false),
  canManageUserIds: integer("can_manage_music_ids", { mode: "boolean" })
    .notNull()
    .default(false),
});
