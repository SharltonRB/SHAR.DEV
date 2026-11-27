// @ts-check
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://shardev-portfolio.vercel.app",
  adapter: vercel(),
});
