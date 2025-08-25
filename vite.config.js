import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Hacemos la app instalable (PWA) y válida en file:// y en hosting
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      // registra el SW automáticamente y lo actualiza
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // habilita PWA también en dev para poder probarlo
      devOptions: { enabled: true },
      // Manifest básico; los iconos los añadimos luego (opcional ahora)
      manifest: {
        name: 'Mis Tareas',
        short_name: 'Tareas',
        start_url: './',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
          // (en el siguiente paso te doy los iconos; por ahora puede quedar vacío)
        ]
      }
    })
  ],
})
