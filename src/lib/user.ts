import { z } from "zod";
import { users } from "./schema/user";
import { getErrors } from "./errors";
import type { Database } from "./db";
import { permissions } from "./schema/permission";

const createUserSchema = z.object({
  username: z
    .string()
    .min(4, {
      message: "username has to be at least 4 characters long",
    })
    .max(128, {
      message: "username can not be longer than 128 characters",
    })
    .regex(/^[a-z0-9_]+$/, {
      message: "username can only contain letters, numbers and underscores",
    }),

  email: z
    .string()
    .min(4, {
      message: "email has to be longer than 4 characters",
    })
    .max(128, {
      message: "email has to be shorter than 128 characters",
    })
    .email("you have to provide a valid email"),
});

type CreateUserSchema = z.infer<typeof createUserSchema>;

export async function createUser(data: CreateUserSchema, db: Database) {
  const parseResult = await createUserSchema.safeParseAsync(data);

  if (!parseResult.success) {
    const errors: string[] = [];
    const fieldErrors = parseResult.error.flatten().fieldErrors;

    errors.push(
      ...getErrors(fieldErrors.email),
      ...getErrors(fieldErrors.username)
    );
    console.log(errors);
    return errors;
  }

  const user = await db
    .transaction(async (trx) => {
      const [permission] = await trx.insert(permissions).values({}).returning();
      const [user] = await trx
        .insert(users)
        .values({
          email: parseResult.data.email,
          username: parseResult.data.username,
          permissionsId: permission.id,
        })
        .returning();

      return await trx.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, user.id),
        with: {
          permissions: true,
        },
      });
    })
    .catch((err) => {
      console.error(`something went wrong: ${err}`);
      return;
    });

  if (!user) {
    return;
  }

  return user;
}
