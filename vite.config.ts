import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  server: {
    host: true, // Accept connections on all IPs (0.0.0.0)
    port: 5173, // Optional, but explicit
    strictPort: true, // Optional: fail if 5173 is taken
    cors: true, // Enable cross-origin if needed
    allowedHosts: ['radius.xnetcloud.tech'],
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      port: 24678,
      clientPort: 24678,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
