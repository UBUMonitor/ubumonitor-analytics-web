import { paraglideVitePlugin } from "@inlang/paraglide-js"
import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    paraglideVitePlugin({ project: "./project.inlang", outdir: "./src/paraglide" }),
    tailwindcss(),
    svelte(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      // tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
})
