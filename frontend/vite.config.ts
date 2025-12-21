import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Incluir apenas arquivos .tsx e .tsx para evitar problemas
      include: '**/*.{jsx,tsx}',
    }),
  ],
  optimizeDeps: {
    exclude: ['canvg'],
    include: ['jspdf', 'jspdf-autotable'],
  },
  server: {
    // Garantir que o HMR está funcionando
    hmr: {
      overlay: true,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'chart-vendor': ['recharts'],
          'flow-vendor': ['reactflow'],
        },
      },
    },
    // Performance optimizations
    minify: 'esbuild',
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
  },
})
