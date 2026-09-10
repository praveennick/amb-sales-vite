// Only the browser test server uses these aliases. Production always uses Firebase.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
const mock = fileURLToPath(new URL("./fixtures/firebase.js", import.meta.url));
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^\.\.\/services\/adminAccess\.js$/, replacement: mock },
      { find: /^(\.\.\/|\.\/)+(services\/)?firebaseDb$/, replacement: mock },
      { find: /^firebase\/auth$/, replacement: mock },
      { find: /^(\.\.\/|\.\/)+firebase$/, replacement: mock },
    ],
  },
});
