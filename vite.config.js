import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// En GitHub Pages la app vive bajo /todo-electron-pwa-publico/
// Usamos una variable de entorno para fijar base en CI.
const isPages = process.env.GITHUB_PAGES === 'true'
const base = isPages ? '/todo-electron-pwa-publico/' : './'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: { enabled: false }, // en CI no hace falta dev PWA
      manifest: {
        name: 'Mis Tareas',
        short_name: 'Tareas',
        start_url: base,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: []
      }
    })
  ],
})
