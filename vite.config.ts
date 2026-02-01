import { defineConfig } from 'vite'
import path from "path"
import fs from "fs"
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
const pkg = JSON.parse(fs.readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version?: string }
const appVersion = String(pkg.version || "0.0.0")
const buildTime = new Date().toISOString()
const gitSha =
  String(
    process.env.VITE_GIT_SHA ||
      process.env.GITHUB_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.COMMIT_SHA ||
      ""
  )

export default defineConfig({
  plugins: [react(), tailwindcss(),],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_BUILD_TIME__: JSON.stringify(buildTime),
    __APP_GIT_SHA__: JSON.stringify(gitSha),
  },
  server: {
    host: true, // Accept connections on all IPs (0.0.0.0)
    port: 5173, // Optional, but explicit
    strictPort: true, // Optional: fail if 5173 is taken
    cors: true, // Enable cross-origin if needed
    allowedHosts: ['radius.xnetcloud.tech'],
    middlewareMode: false,
    fs: {
      strict: false,
    },
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
  optimizeDeps: {
    include: ['@stomp/stompjs']
  }
})
