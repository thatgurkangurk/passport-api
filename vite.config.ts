import devServer from "@hono/vite-dev-server";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  if (mode === "bundle") {
    return {
      build: {
        rollupOptions: {
          input: ["./src/style.css"],
          output: {
            assetFileNames: "[name].[ext]",
          },
        },
        outDir: "static",
      },
    };
  }
  return {
    plugins: [
      devServer({
        entry: "./src/main.tsx",
      }),
    ],
    server: {
      port: 3000,
    },
  };
});
