import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 4173,
  },
  build: {
    // Configuración para producción
    minify: "terser",
    terserOptions: {
      compress: {
        // Eliminar console.log, console.info, console.debug en producción
        // Mantener console.error y console.warn para errores críticos
        drop_console: false,
        pure_funcs: [
          "console.log",
          "console.info",
          "console.debug",
        ],
      },
    },
  },
});




