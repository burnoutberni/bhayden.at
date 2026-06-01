import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const manualChunkGroups: Record<string, string[]> = {
  react: ["react", "react-dom"],
  router: ["react-router", "react-router-dom"],
  radix: [
    "@radix-ui/react-accordion",
    "@radix-ui/react-alert-dialog",
    "@radix-ui/react-aspect-ratio",
    "@radix-ui/react-avatar",
    "@radix-ui/react-checkbox",
    "@radix-ui/react-collapsible",
    "@radix-ui/react-context-menu",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-hover-card",
    "@radix-ui/react-label",
    "@radix-ui/react-menubar",
    "@radix-ui/react-navigation-menu",
    "@radix-ui/react-popover",
    "@radix-ui/react-progress",
    "@radix-ui/react-radio-group",
    "@radix-ui/react-scroll-area",
    "@radix-ui/react-select",
    "@radix-ui/react-separator",
    "@radix-ui/react-slider",
    "@radix-ui/react-slot",
    "@radix-ui/react-switch",
    "@radix-ui/react-tabs",
    "@radix-ui/react-toggle",
    "@radix-ui/react-toggle-group",
    "@radix-ui/react-tooltip",
  ],
  mdx: ["@mdx-js/mdx"],
  charts: ["recharts"],
}

function manualChunks(moduleId: string): string | undefined {
  for (const [chunkName, packages] of Object.entries(manualChunkGroups)) {
    if (packages.some((pkg) => moduleId.includes(`/node_modules/${pkg}/`))) {
      return chunkName
    }
  }

  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    cssMinify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: (moduleId) => manualChunks(moduleId),
      },
    },
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
