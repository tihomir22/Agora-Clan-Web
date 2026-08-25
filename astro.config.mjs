import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { SITE } from './src/data/site.js';

// GitHub Pages inyecta estas dos variables desde el workflow (actions/configure-pages):
//  - SITE_URL:  https://agoraclan.com  o  https://usuario.github.io
//  - BASE_PATH: "/"  o  "/nombre-del-repo"
// Así la web funciona igual en el dominio propio y en la URL de proyecto de GitHub.
const SITE_URL = process.env.SITE_URL || SITE.url;
const BASE_PATH = process.env.BASE_PATH || '/';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'never',
  // Astro 7 cambia el default a JSX; true conserva el espaciado HTML anterior.
  compressHTML: true,
  build: { inlineStylesheets: 'auto', format: 'file' },
  // 'hover' en vez de 'viewport': no se descargan las cinco páginas nada más entrar
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  image: {
    // Todas las <Image /> se sirven en AVIF/WebP con fallback y lazy por defecto.
    service: { entrypoint: 'astro/assets/services/sharp' },
    responsiveStyles: true,
    layout: 'constrained',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/legal/') && !page.includes('/gracias'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize: (item) => {
        const base = BASE_PATH.replace(/\/$/, '');
        const path = new URL(item.url).pathname.replace(/\/$/, '').replace(base, '');
        if (path === '') return { ...item, priority: 1.0, changefreq: 'weekly' };
        if (path === '/torneos' || path === '/descargar') return { ...item, priority: 0.9 };
        if (path === '/comunidad') return { ...item, priority: 0.8 };
        if (path === '/juegos') return { ...item, priority: 0.8 };
        return { ...item, priority: 0.6, changefreq: 'monthly' };
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
