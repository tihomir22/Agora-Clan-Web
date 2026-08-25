# Despliegue de Agora Clan Web

## Fuente única

La fuente canónica de la landing de Ricardo es el repositorio:

`AgoraSocialGaming/Agora-Clan-Web`

El objetivo de hosting es **Cloudflare Pages**. El build se ejecuta con `npm ci` y `npm run verify`;
el directorio publicado es `dist/`.

`public/CNAME` se conserva por ahora. El corte del host y cualquier cambio de DNS son una fase
posterior y no forman parte de este despliegue.

No se debe reactivar ni usar como fuente:

- `AgoraLabs-Org/agora-landing`
- Netlify o cualquier configuración de despliegue de Netlify

## Gates obligatorios

### 1. Verificación local

Desde la raíz del repositorio:

```bash
npm ci
npm run verify
git diff --check
```

`verify` compila la landing con Astro y comprueba los contratos de deep links, los ficheros de
asociación, las cabeceras, los rewrites y los artefactos `dist/r.html` y `dist/t.html`.

### 2. Preview de Cloudflare Pages

Cada cambio se revisa primero en un **Preview Deployment** de Cloudflare Pages. Hay que comprobar,
como mínimo:

- `/`, `/r/CODIGO` y `/t/TOKEN` devuelven la UI correcta con HTTP 200.
- Los botones de los deep links conservan el case y apuntan al destino esperado.
- `/.well-known/apple-app-site-association` y `/.well-known/assetlinks.json` devuelven JSON y no
  sufren ningún redirect.
- `/_astro/*` aparece con cache immutable.
- Con `APP.live = false` no se anuncian App Store ni Google Play como disponibles.
- El fallback `/404` de GitHub Pages conserva query string y hash para `/r/*` y `/t/*`.

### 3. Producción

El paso a producción requiere un OK explícito separado después de revisar el preview. No se
despliega, cambia el dominio ni se activan DNS por inferencia desde un build verde.

El cambio de DNS es un gate independiente: no se modifica mientras no exista autorización
explícita para el corte del host. El correo, la API, `app`, `admin` y el resto de servicios quedan
fuera de esta operación.

## Compatibilidad con GitHub Pages

El workflow `.github/workflows/deploy.yml` conserva un build compatible con GitHub Pages y ejecuta
`npm run verify` antes de subir `dist/`. GitHub Pages no tiene rewrites de servidor, por eso
`src/pages/404.astro` lleva las rutas `/r/*` y `/t/*` a sus artefactos `r.html` y `t.html` sin perder
parámetros.

Cloudflare Pages usa `public/_redirects` para hacer proxy interno de las rutas públicas a los
destinos extensionless con status 200:

```text
/r/* /r 200
/t/* /t 200
```

Aunque Astro conserva los artefactos de build `dist/r.html` y `dist/t.html`, los destinos públicos
de `_redirects` no deben incluir `.html`: Pages normaliza un destino HTML con `308` y pierde el
splat antes de que `DeepLinkFallback` pueda leer el token. El proxy extensionless conserva la URL
`/r/<codigo>` o `/t/<token>` y entrega la UI con HTTP 200.

Los endpoints `/.well-known/*` no se redirigen.
