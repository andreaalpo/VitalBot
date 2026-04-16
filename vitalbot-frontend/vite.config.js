import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    /** Si 8080 está ocupado, Vite usa el siguiente libre (p. ej. 8081). */
    strictPort: false,
  },
})
