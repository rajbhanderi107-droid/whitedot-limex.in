import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
  build: {
    // Prevent source maps from being shipped to production —
    // they expose the full source tree to any visitor with DevTools.
    sourcemap: false,
  },
  // No manualChunks: Vite's default splitting keeps the three.js / R3F /
  // postprocessing stack in lazy chunks off the entry (loaded only when a
  // lazy()'d canvas mounts). A custom manualChunks split caused the entry to
  // eager-import the 3D stack via a shared helper landing in a vendor chunk —
  // correctness (lazy 3D) wins over the marginal parse-size optimisation.
});
