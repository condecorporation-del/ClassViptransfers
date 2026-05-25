import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  const buildTime = new Date().toISOString();
  const commitRef = process.env.COMMIT_REF || process.env.VITE_COMMIT_REF || 'local';
  const context = process.env.CONTEXT || process.env.VITE_CONTEXT || 'local';
  const chunkFamilies: Array<{ name: string; packages: string[] }> = [
    {
      name: 'ui-vendor',
      packages: [
        '@radix-ui/',
        '@floating-ui/',
        'lucide-react',
        'sonner',
        'next-themes',
        'class-variance-authority',
        'tailwind-merge',
        'react-remove-scroll',
        'react-remove-scroll-bar',
        'react-style-singleton',
        'aria-hidden',
      ],
    },
    { name: 'charts-vendor', packages: ['recharts', 'd3-', 'victory-vendor', 'redux', 'react-redux', '@reduxjs/toolkit', 'reselect', 'immer', 'internmap'] },
    { name: 'animation-vendor', packages: ['framer-motion', 'motion-'] },
    { name: 'supabase-vendor', packages: ['@supabase/'] },
    { name: 'stripe-vendor', packages: ['@stripe/', 'stripe'] },
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

          const nodeModulesPath = id.split('node_modules/')[1];
          if (!nodeModulesPath) {
            return undefined;
          }

          const packageName = nodeModulesPath.startsWith('@')
            ? nodeModulesPath.split('/').slice(0, 2).join('/')
            : nodeModulesPath.split('/')[0];

          for (const family of chunkFamilies) {
            if (family.packages.some((prefix) => packageName === prefix || packageName.startsWith(prefix))) {
              return family.name;
            }
          }

          return undefined;
        },
      },
    },
  },
  };
});
