import { SITE, SOCIAL, APP } from '../data/site.js';

const abs = (path = '/') => new URL(path, SITE.url).toString();

/** Identidad de la marca. Va en todas las páginas. */
export const organizationSchema = () => ({
  '@type': 'Organization',
  '@id': abs('/#organization'),
  name: SITE.name,
  alternateName: 'Ágora',
  url: SITE.url,
  logo: { '@type': 'ImageObject', url: abs('/img/og/logo-agora.png'), width: 512, height: 512 },
  description: SITE.description,
  foundingDate: '2026',
  areaServed: 'ES',
  sameAs: SOCIAL.map((s) => s.url),
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@agoraclan.com',
    contactType: 'customer support',
    availableLanguage: ['Spanish', 'English'],
  },
});

export const websiteSchema = () => ({
  '@type': 'WebSite',
  '@id': abs('/#website'),
  url: SITE.url,
  name: SITE.name,
  inLanguage: SITE.locale,
  publisher: { '@id': abs('/#organization') },
});

/** Ficha de aplicación móvil: es la que puede sacar rich result de app. */
export const appSchema = () => ({
  '@type': 'MobileApplication',
  '@id': abs('/#app'),
  name: SITE.name,
  operatingSystem: 'ANDROID, IOS',
  applicationCategory: 'GameApplication',
  applicationSubCategory: 'Esports · Torneos',
  inLanguage: ['es-ES', 'en'],
  description: SITE.description,
  url: SITE.url,
  ...(APP.live && APP.android ? { installUrl: APP.android } : {}),
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  image: abs('/img/og/default.png'),
  screenshot: abs('/img/og/default.png'),
  featureList: [
    'Buscador de compañeros de juego',
    'Torneos por brackets con arbitraje',
    'Clanes con escudo y roles',
    'Perfil RPG con nivel, marcos y títulos',
    'Estadísticas verificadas por API oficial',
  ],
  publisher: { '@id': abs('/#organization') },
});

export const breadcrumbSchema = (items = []) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.label,
    item: abs(item.href),
  })),
});

export const faqSchema = (faqs = []) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

/** Torneo -> Event. Es lo que te mete en el módulo de eventos de Google. */
export const tournamentSchema = (t, url) => ({
  '@type': 'SportsEvent',
  '@id': abs(url) + '#event',
  name: t.title,
  description: t.summary,
  startDate: t.startDate instanceof Date ? t.startDate.toISOString() : t.startDate,
  ...(t.endDate ? { endDate: t.endDate instanceof Date ? t.endDate.toISOString() : t.endDate } : {}),
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
  location: { '@type': 'VirtualLocation', url: abs(url) },
  organizer: { '@id': abs('/#organization') },
  image: [abs(t.cover ?? '/img/og/default.png')],
  offers: {
    '@type': 'Offer',
    url: abs(url),
    price: t.entryPrice ?? '0',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
    validFrom: new Date().toISOString(),
  },
  ...(t.prize ? { award: t.prize } : {}),
});

/** Listado de juegos del catálogo. */
export const gameListSchema = (name, games = []) => ({
  '@type': 'ItemList',
  name,
  numberOfItems: games.length,
  itemListElement: games.map((g, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'VideoGame',
      name: g.name,
      ...(g.studio ? { publisher: { '@type': 'Organization', name: g.studio } } : {}),
    },
  })),
});

export const articleSchema = (entry, url) => ({
  '@type': 'Article',
  headline: entry.title,
  description: entry.description,
  inLanguage: SITE.locale,
  datePublished:
    entry.publishedAt instanceof Date ? entry.publishedAt.toISOString() : entry.publishedAt,
  ...(entry.updatedAt
    ? {
        dateModified:
          entry.updatedAt instanceof Date ? entry.updatedAt.toISOString() : entry.updatedAt,
      }
    : {}),
  author: { '@id': abs('/#organization') },
  publisher: { '@id': abs('/#organization') },
  mainEntityOfPage: abs(url),
});

/** Envuelve un array de nodos en un único bloque @graph. */
export const graph = (nodes = []) =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) });
