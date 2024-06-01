import { GitHub } from "arctic";
import type { Context } from "hono";
import type { AppContext } from "../context";
import { oauthAccounts } from "../schema/oauth-account";
import type { DatabaseUserAttributes } from "../auth";
import { generateId } from "lucia";
import { users } from "../schema/user";
import { createUser } from "../user";

const githubClient = () =>
  new GitHub(
    Bun.env.GITHUB_CLIENT_ID as string,
    Bun.env.GITHUB_CLIENT_SECRET as string
  );

export async function getGithubAuthorisationUrl({
  c,
  state,
}: {
  c: Context<AppContext>;
  state: string;
}) {
  const github = githubClient();
  return await github.createAuthorizationURL(state, {
    scopes: ["read:user", "user:email"],
  });
}

export const createGithubSession = async ({
  c,
  idToken,
  sessionToken,
}: {
  c: Context<AppContext>;
  idToken: string;
  sessionToken?: string;
}) => {
  const github = githubClient();
  const tokens = await github.validateAuthorizationCode(idToken);
  const githubUserResponse = await fetch("https://api.github.com/user", {
    headers: {
      "User-Agent": "hono",
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  const githubUserResult: {
    id: number;
    login: string; // username
    name: string;
    avatar_url: string;
  } = await githubUserResponse.json();

  const userEmailResponse = await fetch("https://api.github.com/user/emails", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  const userEmailResult: {
    email: string;
    primary: boolean;
    verified: boolean;
  }[] = await userEmailResponse.json();

  const primaryEmail = userEmailResult.find((email) => email.primary);
  if (!primaryEmail) {
    return null;
  }
  const existingAccount = await c.get("db").query.oauthAccounts.findFirst({
    where: (account, { eq }) =>
      eq(account.providerUserId, githubUserResult.id.toString()),
  });
  let existingUser: DatabaseUserAttributes | null = null;
  if (sessionToken) {
    const sessionUser = await c.get("lucia").validateSession(sessionToken);
    if (sessionUser.user) {
      existingUser = sessionUser.user as DatabaseUserAttributes;
    }
  } else {
    const response = await c.get("db").query.users.findFirst({
      where: (u, { eq }) => eq(u.email, primaryEmail.email),
    });
    if (response) {
      existingUser = response;
    }
  }
  if (existingUser && primaryEmail.verified && !existingAccount) {
    await c.get("db").insert(oauthAccounts).values({
      providerUserId: githubUserResult.id.toString(),
      provider: "github",
      userId: existingUser.id,
    });
    const session = await c.get("lucia").createSession(existingUser.id, {});
    return session;
  }

  if (existingAccount) {
    const session = await c
      .get("lucia")
      .createSession(existingAccount.userId, {});
    return session;
  }
  let username = githubUserResult.login;
  const existingUsername = await c.get("db").query.users.findFirst({
    where: (u, { eq }) => eq(u.username, username),
  });
  if (existingUsername) {
    username = `${username}-${generateId(5)}`;
  }
  const user = await createUser(
    {
      username,
      profilePictureUrl: githubUserResult.avatar_url,
      email: primaryEmail.email,
    },
    c.get("db")
  );

  if (!user) {
    return;
  }

  await c.get("db").insert(oauthAccounts).values({
    providerUserId: githubUserResult.id.toString(),
    provider: "github",
    userId: user.id,
  });
  const session = await c.get("lucia").createSession(user.id, {});
  return session;
};
