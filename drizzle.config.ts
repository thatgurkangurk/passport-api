import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/schema/*",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DB_URI as string,
  },
});
