import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Split the heavy 3D vendor code into separate named chunks so the
        // browser parses them as smaller units (lower TBT) instead of one
        // ~1MB monolith. These stay lazy — only fetched when a lazy R3F
        // component (hero / Born of LIMEX) mounts.
        manualChunks(id) {
          if (id.includes("node_modules/three/")) return "vendor-three";
          if (id.includes("node_modules/@react-three/")) return "vendor-r3f";
          if (
            id.includes("node_modules/postprocessing/") ||
            id.includes("node_modules/n8ao/")
          )
            return "vendor-postprocessing";
        },
      },
    },
  },
});
