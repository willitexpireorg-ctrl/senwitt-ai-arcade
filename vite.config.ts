import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        // Vite 8 / Rolldown: split stable vendor code out of the app entry so
        // React + Supabase cache independently of product deploys, and the
        // main chunk warning drops below ~500KB.
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules\/(?:react|react-dom|scheduler)\//,
            },
            {
              name: 'vendor-supabase',
              test: /node_modules\/@supabase\//,
            },
            {
              name: 'vendor',
              test: /node_modules/,
            },
          ],
        },
      },
    },
  },
})
