import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const page = (name: string) => fileURLToPath(new URL(`${name}.html`, import.meta.url));

// The desktop webviews, built into desktop/dist for Tauri. They import the extension's
// prompts and text checks from ../src, so both ship the same behavior.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    rolldownOptions: { input: { index: page("index"), overlay: page("overlay"), card: page("card") } },
  },
});
