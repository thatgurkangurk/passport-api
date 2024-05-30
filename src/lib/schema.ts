import * as usersSchema from "./schema/user";
import * as sessionsSchema from "./schema/session";
import * as permissionsSchema from "./schema/permission";

export const schema = { ...usersSchema, ...sessionsSchema, ...permissionsSchema };