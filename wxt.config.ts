import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Glimpse",
    description:
      "Privacy-first, local-AI Chrome extension for flow-state learning.",
    permissions: ["storage"],
  },
});
