# Apertura pública de Agora — preparación 29 octubre 2026

## Estado que se conserva durante esta preparación

Producción sigue con ALLOW_SIGNUP=false, INVITE_REQUIRED=false y sin founder_preregistration_cutoff_at. Cuentas existentes conservan acceso; el prerregistro continúa hasta fijar su corte. No se envían versiones a revisión pública ni se publican en las tiendas en esta ejecución. QA físico final de iPhone sigue pendiente. El acuerdo de apps pagadas Apple está activo y actualizado, verificado el29oct2026 tras la aceptación del titular; el PLA también está aceptado. No repetir la aceptación.

## Integración por propietario de la landing

PR canónico: https://github.com/AgoraSocialGaming/Agora-Clan-Web/pull/1 . El propietario integra este PR y deja terminar Pages desde main. La fuente publicada es este repositorio/GitHub Pages; no Agora-landing ni el dominio Netlify antiguo. No hace falta otra integración para cambiar del prerregistro a descargas: la landing consulta GET https://api.agoraclan.com/api/v1/config .

Después de integrar, comprobar en el dominio real (no solo CI): /privacy, /privacy.html, /terminos-y-politicas, /soporte, /assets/legal/privacy.html, /assets/legal/account-deletion.html, /.well-known/assetlinks.json y /.well-known/apple-app-site-association . Revisar redirecciones, contenido correcto,200final y ausencia de caché404. Las asociaciones deben conservar la identidad Apple84F6K9ACAA.com.agoraclan.app y las huellas Android aprobadas.

La comprobación MIME de AASA y el QA de enlaces instalados queda en el bloque final por decisión del titular. GitHub Pages ignora _headers/_redirects: publicar JSON no demuestra que Universal Links esté aceptado. No activar proxyDNS ni crear reglas Cloudflare en esta fase.

Solo con los legales públicos y comprobados, actualizar soporte/privacidad de ambas tiendas a https://agoraclan.com/soporte y https://agoraclan.com/privacy (el documento canónico final puede ser /assets/legal/privacy.html; los alias deben funcionar). No introducir URLs aún404 en fichas. Mantener marketing https://agoraclan.com .

Apple conserva por ahora las URLs antiguas de Netlify, que no sirven como aceptación de los legales. Si el estado de revisión bloquea su edición, retirar solo la versión de app del borrador existente, corregir las URLs verificadas y volver a añadirla al mismo borrador; comprobar de nuevo los nueve elementos antes del envío. No crear otro envío ni enviar para desbloquear una edición.

## Revisión pública después del iPhone

Candidatos actuales sin recompilar por cambio de contrato aditivo: Android1.0.38(39), alpha activo y producción en borrador; iOS1.0.5(20), TestFlight interno, versión App Store en READY_FOR_REVIEW sin envío; IPA QA1.0.5(9047), staging/Sandbox para iPhone. Verificar los IDs y los commits antes del envío final. No convertir un artefacto CI en afirmación de disponibilidad.

Completar primero QA físico Apple: instalar IPA, Google/Apple login, compra Sandbox de pack/Rise, restauración, notificaciones/deep links y casos de gesto pendientes. El error nativo Apple6003 sigue abierto hasta probar corrección física. Verificar otra vez catálogo, mapeo RevenueCat y cuenta de App Review aislada, sin datos ni compras reales de producción.

Revalidar que el acuerdo pagado Apple sigue activo. Mantener releaseType=MANUAL. El borrador existente830504d9-9600-421f-afaf-07c9b15fc37e ya contiene los nueve elementos: versión1.0.5/build20, cinco consumibles AR, Rise mensual/anual y grupo Agora Rise22236907; todos READY_FOR_REVIEW y submittedDate vacío, comprobado por API el29oct2026. Se completaron las preguntas nuevas de redes sociales preservando las respuestas anteriores y el precio gratuito de la app en175territorios; esto no modifica precios de compras. Revisar metadatos/localizaciones/imágenes completas y URLs legales. No enviar solo los primeros IAP sin versión de app: Apple requiere la primera compra de cada tipo con versión nueva. El borrador debe permanecer sin submitted=true hasta QA final.

Google Play: conservar Managed publishing on. Producción39 seguirá borrador hasta enviar la revisión final después del iPhone. Comprobar Data safety, ficha, política de privacidad/eliminación, acceso para reviewer, disponibilidad y precios. La ampliación IAP es independiente de la publicación gestionada: sus cambios regionales pueden aplicarse antes y no equivalen a abrir el registro.

La ampliación ya está aplicada y comprobada: cinco packs y Rise mensual/anual ACTIVE en174regiones cada uno, preservando exactamente las configuraciones previas de ES/ET/MN y el resto de términos. No repetir la operación para preparar la publicación de la app.

## Corte de fundadores y apertura

Cuando ambas tiendas hayan aprobado y se pueda ejecutar la apertura final, publicar las versiones retenidas y hacer read-back de su disponibilidad real. Registrar un instante UTC timezone-aware inmediatamente antes de abrir el registro, mediante PUT /admin/config con founder_preregistration_cutoff_at en el servicio ya existente. Este corte se fija solo entonces; no usar fecha de esta preparación ni la aprobación CI como corte.

Confirmar GET /api/v1/config: preregistration_open=false al llegar al instante. El POST /api/v1/preregister debe responder410/preregistration_closed desde ese instante. Los pack_fundador_pending legítimos anteriores conservan su entrega idempotente al primer login incluso después del corte. Altas normales posteriores no reciben pack fundador. No crear campaña masiva de fundadores ni incluir automáticamente toda la beta cerrada.

Activar ALLOW_SIGNUP=true e INVITE_REQUIRED=false en producción, verificar despliegue/config y probar una alta normal con datos QA autorizados. La landing debe mostrar descargas y dejar de ofrecer prerregistro/fundadores sin otro merge. Registrar UTC/entorno/deploy/versión y las dos URLs públicas en Projects.

Si hay que cerrar altas, revertir ALLOW_SIGNUP=false preservando el corte. No borrar ni mover el corte hacia el futuro, no reabrir prerregistro y no retirar premios legítimos concedidos. El cofre extra de beta cerrada es una campaña separada pendiente de cohorte explícita de UUIDs.
