import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  const buildTime = new Date().toISOString();
  const commitRef = process.env.COMMIT_REF || process.env.VITE_COMMIT_REF || 'local';
  const context = process.env.CONTEXT || process.env.VITE_CONTEXT || 'local';

  const vendorChunkGroups: Array<[string, string[]]> = [
    ['radix-ui', ['@radix-ui']],
    ['ui-kit', ['class-variance-authority', 'clsx', 'tailwind-merge', 'cmdk', 'next-themes', 'sonner']],
    ['motion-icons', ['framer-motion', 'lucide-react']],
    ['date-picker', ['date-fns', 'react-day-picker']],
    ['stripe', ['@stripe']],
    ['forms', ['react-hook-form', '@hookform/resolvers', 'zod']],
  ];

  return {
  server: {
    host: true, // Allow external connections
    port: 5173, // Local development port
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: false, // Preserve Host: localhost:5173 so cookie scope matches frontend
        secure: false,
      },
    },
  },
  plugins: [
    react(),
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          for (const [chunkName, matchers] of vendorChunkGroups) {
            if (matchers.some((matcher) => id.includes(`/node_modules/${matcher}/`) || id.includes(`\\node_modules\\${matcher}\\`))) {
              return chunkName;
            }
          }

          return 'vendor';
        },
      },
    },
  },
  };
});
