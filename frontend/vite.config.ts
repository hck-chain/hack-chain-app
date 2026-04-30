/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Separa bibliotecas de Web3 que son MUY pesadas
            if (id.includes("@reown") || id.includes("@walletconnect") || id.includes("ethers")) {
              return "web3-vendor";
            }
            // Separa el core de React
            if (id.includes("react/") || id.includes("react-dom") || id.includes("react-router")) {
              return "react-vendor";
            }
            // Separa toda la UI (shadcn, radix, framer-motion, lucide)
            if (id.includes("@radix-ui") || id.includes("framer-motion") || id.includes("lucide")) {
              return "ui-vendor";
            }
            // Todo el resto cae en un paquete genérico
            return "vendor";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
