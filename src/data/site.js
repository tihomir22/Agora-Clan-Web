// ---------------------------------------------------------------------------
// FUENTE ÚNICA DE VERDAD
// Cambia aquí y cambia en toda la web: SEO, schema, footer, CTAs y enlaces.
// ---------------------------------------------------------------------------

export const SITE = {
  name: 'Agora Clan',
  shortName: 'Ágora',
  url: 'https://agoraclan.com',
  locale: 'es-ES',
  lang: 'es',
  description:
    'La arena digital para gamers. Encuentra con quién jugar, monta tu propio torneo con brackets y haz crecer un perfil que demuestra lo que has conseguido.',
  themeColor: '#0AFF7A',
  twitterHandle: '@agoraclan_',
};

// --- Estado de las tiendas --------------------------------------------------
// Las URLs reales viven aquí, pero la web solo las expone cuando
// GET /api/v1/config confirma `signup_enabled && !invite_required`. `live`
// es el estado estático (sin afirmar disponibilidad) y no se toca a mano.
export const APP = {
  live: false,
  ios: 'https://apps.apple.com/app/id6790832454',
  android: 'https://play.google.com/store/apps/details?id=com.agoraclan.app',
};

// --- Config pública en runtime ---------------------------------------------
// Una sola URL para que la fase se calcule igual en toda la web.
export const CONFIG_ENDPOINT =
  import.meta.env.PUBLIC_CONFIG_ENDPOINT || 'https://api.agoraclan.com/api/v1/config';

// --- Pre-registro -----------------------------------------------------------
export const FORM = {
  // Se puede sobrescribir al compilar con PUBLIC_FORM_ENDPOINT, sin tocar el código.
  endpoint: import.meta.env.PUBLIC_FORM_ENDPOINT || 'https://api.agoraclan.com/api/v1/preregister',
  legalUrl: `${SITE.url}/privacy`,
  minAge: 14,
  slots: 7000,
};

export const SOCIAL = [
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/agoraclan_',
    handle: '@agoraclan_',
    title: 'Ágora en Instagram: novedades y torneos',
  },
  {
    name: 'TikTok',
    url: 'https://www.tiktok.com/@agoraclan_',
    handle: '@agoraclan_',
    title: 'Ágora en TikTok: jugadas, torneos y comunidad',
  },
];

export const NAV = [
  {
    label: 'Inicio',
    href: '/',
    icon: 'home',
    hint: 'La arena, de un vistazo',
    title: 'Ágora: encuentra jugadores y organiza torneos',
  },
  {
    label: 'Torneos',
    href: '/torneos',
    icon: 'trophy',
    hint: 'Descubre la arena y sus posibilidades',
    title: 'Torneos, duelos y batallas: cómo se compite en Ágora',
  },
  {
    label: 'Juegos',
    href: '/juegos',
    icon: 'pad',
    hint: 'Nuestro catálogo',
    title: 'Catálogo de juegos para competir en Ágora',
  },
  {
    label: 'Descargar',
    href: '/descargar',
    icon: 'download',
    hint: 'Cómo descargar Ágora',
    title: 'Descargar Ágora en iOS y Android',
  },
  {
    label: 'FAQ',
    href: '/faq',
    icon: 'help',
    hint: 'Todas las dudas resueltas',
    title: 'Preguntas frecuentes sobre Ágora',
  },
];

export const LEGAL = [
  { label: 'Política de privacidad', href: `${SITE.url}/privacy`, title: 'Política de privacidad de Ágora' },
  { label: 'Soporte', href: `${SITE.url}/soporte`, title: 'Soporte de Ágora' },
  {
    label: 'Eliminar cuenta',
    href: `${SITE.url}/assets/legal/account-deletion.html`,
    title: 'Cómo solicitar la eliminación de cuenta o datos',
  },
];
