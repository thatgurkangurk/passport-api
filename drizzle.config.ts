import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/schema/*",
  out: "./drizzle",
  dbCredentials: {
    url: "./data/passport.db"
  }
});