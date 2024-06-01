import { Hono } from "hono";
import type { AppContext } from "../lib/context";
import { getOAuthAccounts } from "./api/user";
import { Notice } from "../components/auth/notice";
import { oauthProviders } from "./api/auth";

const userRoutes = new Hono<AppContext>();

userRoutes.get("/", async (c) => {
  const session = c.get("session");
  const user = c.get("user");

  if (!session || !user) return c.json("Unauthorized", 403);

  const oAuthAccounts = await getOAuthAccounts(c);

  return c.render(
    <>
      <h1 class="text-3xl">gurkz Passport - user</h1>
      <div class="flex items-center gap-2">
        <img
          src={user.profilePictureUrl}
          // biome-ignore lint/a11y/noRedundantAlt: profile picture explains it well
          alt={`profile picture of ${user.username}`}
          class="rounded-full h-24"
        />
        <h2 class="text-2xl">hello, {user.username}!</h2>
      </div>

      <Notice
        title="notice"
        description="this interface is work in progress. more features will be added later"
      />
      <h3 class="text-xl">OAuth</h3>
      <p>
        you are currently not able to disconnect any OAuth providers. if you
        want to do that, please{" "}
        <a
          href="mailto:hello@gurkz.me"
          class="underline underline-offset-4 decoration-orange-400"
        >
          send me a mail at hello (at) gurkz (dot) me
        </a>{" "}
        and I will get back to you as soon as possible
      </p>
      <ul class="list-disc list-inside">
        {oauthProviders.map((provider) => (
          <div key={provider} class="flex gap-3 items-center">
            <h4>{provider}</h4>
            {oAuthAccounts.some(
              (account) => account.provider === provider.toLowerCase()
            ) ? (
              <>
                <span class="bg-green-700 p-2 rounded-md">connected</span>
              </>
            ) : (
              <a
                href={`/api/auth/${provider.toLowerCase()}?redirect=${
                  import.meta.env.VITE_DOMAIN
                }/user`}
                class="bg-teal-700 p-2 rounded-md"
              >
                connect
              </a>
            )}
          </div>
        ))}
      </ul>
      <br />
      <br />
      <br />
      <p>
        you are currently not able to delete your account with this interface.
        if you want to do that, please{" "}
        <a
          href="mailto:hello@gurkz.me"
          class="underline underline-offset-4 decoration-orange-400"
        >
          send me a mail at hello (at) gurkz (dot) me
        </a>{" "}
        and I will get back to you as soon as possible
      </p>
      <br />
      <a
        href={`/api/auth/logout?redirect=${import.meta.env.VITE_DOMAIN}`}
        class="bg-red-700 p-2 pt-2 rounded-md"
      >
        sign out
      </a>
    </>
  );
});

export { userRoutes };
