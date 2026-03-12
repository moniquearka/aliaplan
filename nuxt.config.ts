// https://nuxt.com/docs/api/configuration/nuxt-config
const baseURL = process.env.NUXT_APP_BASE_URL || '/aliaplan/'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  // Geração estática para GitHub Pages
  ssr: false,
  // Base URL: usa variável de ambiente NUXT_APP_BASE_URL
  // No GitHub Actions: NUXT_APP_BASE_URL=/aliaplan/
  // Em desenvolvimento: não definida (usa '/')
  app: {
    baseURL,
    head: {
      title: 'ALIA - Jornada de Vida',
      link: [
        { rel: 'icon', type: 'image/png', href: `${baseURL}favicon.png` },
        { rel: 'shortcut icon', type: 'image/png', href: `${baseURL}favicon.png` },
        { rel: 'apple-touch-icon', href: `${baseURL}favicon.png` },
      ],
    },
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
