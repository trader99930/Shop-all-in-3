import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/*",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
