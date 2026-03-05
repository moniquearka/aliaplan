// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  // Geração estática para GitHub Pages
  ssr: false,
  // Base URL para GitHub Pages: moniquearka.github.io/aliaplan/
  // Quando o domínio customizado aliaplan.zooxsmart.com estiver ativo,
  // o baseURL pode ser alterado para '/'
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/aliaplan/',
  },
  modules: ['@pinia/nuxt'],
  // assets/ está em app/assets/ (srcDir do Nuxt 4), ~ aponta para app/
  css: ['~/assets/css/main.css'],
  vite: {
    server: {
      allowedHosts: true,
    },
    optimizeDeps: {
      include: ['html-to-image', 'jspdf'],
    },
  },
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
})
