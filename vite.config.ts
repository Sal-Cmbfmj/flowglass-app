import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: { rollupOptions: { input: {
    main: path.resolve(__dirname, "index.html"),
    widget: path.resolve(__dirname, "widget.html"),
  } } },
  server: { host: "127.0.0.1", port: Number(process.env.PORT || 8443), strictPort: true },
});
