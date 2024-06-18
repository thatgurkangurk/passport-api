import * as usersSchema from "./schema/user";
import * as sessionsSchema from "./schema/session";
import * as permissionsSchema from "./schema/permission";
import * as oauthAccountsSchema from "./schema/oauth-account";

export const schema = {
  ...usersSchema,
  ...sessionsSchema,
  ...permissionsSchema,
  ...oauthAccountsSchema,
};
