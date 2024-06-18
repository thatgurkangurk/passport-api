import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  security: {
    checkOrigin: true
  },
  output: "server",
  adapter: node({
    mode: "standalone"
  })
});