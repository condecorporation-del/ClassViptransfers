import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Build-time environment variables for Netlify
  const buildTime = new Date().toISOString();
  const commitRef = process.env.COMMIT_REF || process.env.VITE_COMMIT_REF || 'local';
  const context = process.env.CONTEXT || process.env.VITE_CONTEXT || 'local';

  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
        // PWA disabled temporarily to prevent caching old versions
        // VitePWA({
        //   registerType: "autoUpdate",
        //   includeAssets: ["favicon.ico", "logo.png", "robots.txt"],
        //   manifest: {
        //     name: "Class VIP Transfers",
        //     short_name: "Class VIP",
        //     description: "Luxury Transportation & Experiences in Los Cabos",
        //     theme_color: "#071A2B", // Navy
        //     background_color: "#F7FAFF", // Off-white
        //     display: "standalone",
        //     orientation: "portrait",
        //     scope: "/",
        //     start_url: "/",
        //     icons: [
        //       {
        //         src: "/icons/icon-192x192.png",
        //         sizes: "192x192",
        //         type: "image/png",
        //         purpose: "any maskable",
        //       },
        //       {
        //         src: "/icons/icon-512x512.png",
        //         sizes: "512x512",
        //         type: "image/png",
        //         purpose: "any maskable",
        //       },
        //     ],
        //   },
        //   workbox: {
        //     globPatterns: ["**/*.{js,css,html,ico,svg,woff2}"],
        //     globIgnores: ["**/logo.png", "**/placeholder.svg"],
        //     maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        //     runtimeCaching: [
        //       {
        //         urlPattern: /^https:\/\/api\./,
        //         handler: "NetworkFirst",
        //         options: {
        //           cacheName: "api-cache",
        //           networkTimeoutSeconds: 10,
        //           cacheableResponse: {
        //             statuses: [0, 200],
        //           },
        //         },
        //       },
        //       {
        //         urlPattern: /^https:\/\/.*\/api\/admin\/.*/,
        //         handler: "NetworkOnly",
        //         options: {
        //           cacheName: "admin-api-no-cache",
        //         },
        //       },
        //       {
        //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        //         handler: "CacheFirst",
        //         options: {
        //           cacheName: "google-fonts-cache",
        //           expiration: {
        //             maxEntries: 10,
        //             maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        //           },
        //         },
        //       },
        //       {
        //         urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        //         handler: "CacheFirst",
        //         options: {
        //           cacheName: "gstatic-fonts-cache",
        //           expiration: {
        //             maxEntries: 10,
        //             maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        //           },
        //         },
        //       },
        //     ],
        //   },
        //   devOptions: {
        //     enabled: false, // Disable in dev to avoid service worker issues
        //   },
        // }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    'import.meta.env.VITE_COMMIT_REF': JSON.stringify(commitRef),
    'import.meta.env.VITE_CONTEXT': JSON.stringify(context),
  },
  };
});
