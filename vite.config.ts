import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    process.env.ANALYZE === 'true'
      ? visualizer({ open: true, gzipSize: true, brotliSize: true })
      : undefined,
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('node_modules/@react-three/fiber/')) return 'r3f'
          if (id.includes('node_modules/framer-motion/')) return 'framer'
        },
      },
    },
  },
})