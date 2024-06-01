import type { Context } from "hono";
import type { AppContext } from "../context";
import { Discord } from "arctic";
import type { DatabaseUserAttributes } from "../auth";
import { oauthAccounts } from "../schema/oauth-account";
import { generateId } from "lucia";
import { createUser } from "../user";

const discordClient = (c: Context<AppContext>) =>
  new Discord(
    Bun.env.DISCORD_CLIENT_ID as string,
    Bun.env.DISCORD_CLIENT_SECRET as string,
    `${process.env.VITE_DOMAIN}/api/auth/discord/callback`
  );

export async function getDiscordAuthorisationUrl({
  c,
  state,
}: {
  c: Context<AppContext>;
  state: string;
}) {
  const discord = discordClient(c);
  return await discord.createAuthorizationURL(state, {
    scopes: ["identify", "email"],
  });
}

export async function createDiscordSession({
  c,
  idToken,
  sessionToken,
}: {
  c: Context<AppContext>;
  idToken: string;
  sessionToken?: string;
}) {
  const discord = discordClient(c);
  const tokens = await discord.validateAuthorizationCode(idToken);
  const discordUserResponse = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });

  const response = await discordUserResponse.json();

  const discordUserResult: {
    id: number;
    username: string;
    email: string;
    avatar_url: string;
  } = {
    avatar_url: `https://cdn.discordapp.com/avatars/${response.id}/${response.avatar}`,
    ...response,
  };

  const existingAccount = await c.get("db").query.oauthAccounts.findFirst({
    where: (account, { eq }) =>
      eq(account.providerUserId, discordUserResult.id.toString()),
  });

  let existingUser: DatabaseUserAttributes | null = null;
  if (sessionToken) {
    const sessionUser = await c.get("lucia").validateSession(sessionToken);
    if (sessionUser.user) {
      existingUser = sessionUser.user as DatabaseUserAttributes;
    }
  } else {
    const response = await c.get("db").query.users.findFirst({
      where: (u, { eq }) => eq(u.email, discordUserResult.email),
    });
    if (response) {
      existingUser = response;
    }
  }
  if (existingUser?.email && existingUser.id && !existingAccount) {
    await c.get("db").insert(oauthAccounts).values({
      providerUserId: discordUserResult.id.toString(),
      provider: "discord",
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
  let username = discordUserResult.username;
  const existingUsername = await c.get("db").query.users.findFirst({
    where: (u, { eq }) => eq(u.username, username),
  });

  if (existingUsername) {
    username = `${username}-${generateId(5)}`;
  }
  const user = await createUser(
    {
      username,
      profilePictureUrl: discordUserResult.avatar_url,
      email: discordUserResult.email,
    },
    c.get("db")
  );

  if (!user) {
    console.error("USER FAILED TO CREATE");
    return;
  }

  await c.get("db").insert(oauthAccounts).values({
    providerUserId: discordUserResult.id.toString(),
    provider: "discord",
    userId: user.id,
  });
  const session = await c.get("lucia").createSession(user.id, {});
  return session;
}
