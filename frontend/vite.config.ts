/// <reference types="vitest" />
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
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
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  optimizeDeps: {
    // @reown/appkit only import()s these scaffold-ui subpaths at runtime,
    // inside the wallet modal, gated by remote feature flags — Vite's dep
    // scanner never sees that branch execute, so it never pre-bundles them
    // and every first modal open 404s on the missing chunk. Listing them
    // here forces the pre-bundle at server start instead of on demand.
    include: [
      '@reown/appkit-scaffold-ui',
      '@reown/appkit-scaffold-ui/w3m-modal',
      '@reown/appkit-scaffold-ui/swaps',
      '@reown/appkit-scaffold-ui/send',
      '@reown/appkit-scaffold-ui/receive',
      '@reown/appkit-scaffold-ui/onramp',
      '@reown/appkit-scaffold-ui/transactions',
      '@reown/appkit-scaffold-ui/embedded-wallet',
      '@reown/appkit-scaffold-ui/socials',
      '@reown/appkit-scaffold-ui/email',
      '@reown/appkit-scaffold-ui/pay-with-exchange',
      '@reown/appkit-pay',
    ],
  },
  build: {
    // Strip all console.* calls from production bundles — prevents PII leaks in DevTools
    esbuild: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@reown") || id.includes("@walletconnect") || id.includes("ethers")) {
              return "web3-vendor";
            }
            // Solo el core de React — sin react-router (tiene deps que crean circular chunks)
            if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/") || id.includes("/node_modules/scheduler/")) {
              return "react-vendor";
            }
            if (id.includes("@radix-ui") || id.includes("framer-motion") || id.includes("lucide")) {
              return "ui-vendor";
            }
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
    // e2e/ holds Playwright specs (import { test } from '@playwright/test') —
    // without this, Vitest's default glob picks them up too and runs them
    // with the wrong test runner.
    exclude: [...configDefaults.exclude, "e2e/**"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Pin React to the workspace copy in the test environment only. The
      // monorepo root ships React 19 for unrelated tooling; without this
      // alias, vitest loads two React majors and breaks hooks. Limited to
      // `test.alias` so the production build keeps its existing resolution.
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    server: {
      deps: {
        // Force these packages through Vite's transform pipeline so the
        // resolve.alias for "react" applies inside their bare imports too.
        // Without this, externalized deps load root React (19) while the
        // app gets workspace React (18) → broken hooks.
        inline: [/@tanstack\/react-query/, /@testing-library\/react/],
      },
    },
  },
}));
