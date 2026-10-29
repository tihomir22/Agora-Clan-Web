/*
 * Fases públicas de Ágora (pre-registro / descarga / próximamente).
 *
 * Fuente única de verdad: GET /api/v1/config. La web NO afirma que el
 * pre-registro esté abierto ni que la app esté publicada hasta que la API lo
 * confirma. Mientras carga, falla la red o el contrato no trae el dato, el
 * estado es `unknown` y no se muestra ninguna oferta de fundador.
 *
 * Script clásico (sin módulos) para que los scripts inline de Astro puedan
 * usarlo sin bundler. También se importa desde los tests de Node con `vm`.
 */
(function (global) {
  'use strict';

  var PHASE = {
    LIVE: 'live',
    PREREGISTER: 'preregister',
    UPCOMING: 'upcoming',
    UNKNOWN: 'unknown',
  };

  // URLs de las tiendas. La fuente única es `APP` en src/data/site.js y se
  // inyecta con `configure` antes de `init`; mientras no lleguen, no se
  // expone ningún enlace. La UI solo las usa cuando la config confirma `live`.
  var STORE_LINKS = { ios: '', android: '' };

  function configure(options) {
    var links = options && options.storeLinks;
    if (!links || typeof links !== 'object') return STORE_LINKS;
    // Se muta el mismo objeto para que la referencia publicada siga válida.
    STORE_LINKS.ios = typeof links.ios === 'string' ? links.ios : '';
    STORE_LINKS.android = typeof links.android === 'string' ? links.android : '';
    return STORE_LINKS;
  }

  function unknownState(error) {
    return {
      phase: PHASE.UNKNOWN,
      live: false,
      founderOpen: false,
      signupEnabled: false,
      inviteRequired: false,
      known: false,
      error: error === true,
    };
  }

  /**
   * Traduce la config pública a una fase. `live` gana a `preregister`: una vez
   * abierto el acceso normal, la oferta de fundador deja de mostrarse.
   * Cualquier valor ausente o inesperado falla cerrado.
   */
  function resolveConfig(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return unknownState(false);
    }
    if (
      typeof config.signup_enabled !== 'boolean' ||
      typeof config.invite_required !== 'boolean'
    ) {
      return unknownState(false);
    }

    var signupEnabled = config.signup_enabled === true;
    var inviteRequired = config.invite_required === true;
    var live = signupEnabled && !inviteRequired;

    // Sin el flag no se puede afirmar ni apertura ni cierre: estado neutral.
    if (!live && typeof config.preregistration_open !== 'boolean') {
      return unknownState(false);
    }

    var founderOpen = !live && config.preregistration_open === true;

    return {
      phase: live ? PHASE.LIVE : founderOpen ? PHASE.PREREGISTER : PHASE.UPCOMING,
      live: live,
      founderOpen: founderOpen,
      signupEnabled: signupEnabled,
      inviteRequired: inviteRequired,
      known: true,
      error: false,
    };
  }

  /**
   * Normaliza la respuesta del POST /preregister. El cierre por cutoff llega
   * como 410 + `preregistration_closed`; la UI debe cerrar el formulario y
   * pasar a la fase de próximamente en vez de ofrecer reintentos.
   */
  function submitOutcome(status, body) {
    var payload = body && typeof body === 'object' ? body : {};
    var rawDetail = payload.detail;
    var rawError = payload.error && payload.error.message;
    var detail =
      typeof rawDetail === 'string'
        ? rawDetail
        : typeof rawError === 'string'
          ? rawError
          : typeof payload.message === 'string'
            ? payload.message
            : '';

    if (status >= 200 && status < 300) {
      return { kind: 'ok', detail: detail };
    }
    if (status === 410 && detail.indexOf('preregistration_closed') !== -1) {
      return { kind: 'closed', detail: detail };
    }
    if (detail.indexOf('invite_required') !== -1) {
      return { kind: 'invite_required', detail: detail };
    }
    if (detail.indexOf('invite_code') !== -1) {
      return { kind: 'invite_code', detail: detail };
    }
    if (status === 409) {
      return { kind: 'conflict', detail: detail };
    }
    if (status === 422 || status === 400) {
      return { kind: 'validation', detail: detail };
    }
    return { kind: 'error', detail: detail };
  }

  function setHidden(element, hide) {
    if (!element) return;
    element.hidden = hide === true;
    if (hide) {
      element.setAttribute('aria-hidden', 'true');
    } else {
      element.removeAttribute('aria-hidden');
    }
  }

  function each(root, selector, visit) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    var nodes = root.querySelectorAll(selector);
    for (var index = 0; index < nodes.length; index += 1) {
      visit(nodes[index]);
    }
  }

  /** Aplica una fase al DOM. Solo muestra la fase activa y nunca deja enlaces
   * de tienda activos fuera de `live`. */
  function apply(root, state) {
    if (!root || !state || !state.phase) return state;

    each(root, '[data-phase]', function (element) {
      setHidden(element, element.getAttribute('data-phase') !== state.phase);
    });

    each(root, '[data-store-link]', function (element) {
      var store = element.getAttribute('data-store-link');
      var href = state.live ? STORE_LINKS[store] : '';
      if (href) {
        element.setAttribute('href', href);
        element.setAttribute('rel', 'noopener');
        setHidden(element, false);
      } else {
        element.removeAttribute('href');
        setHidden(element, true);
      }
    });

    each(root, '[data-store-pending]', function (element) {
      // En `unknown` no se afirma ni disponibilidad ni cierre: sin controles.
      setHidden(element, state.live === true || state.phase === PHASE.UNKNOWN);
    });

    each(root, '[data-app-cta]', function (element) {
      element.textContent = state.live
        ? 'Descargar'
        : state.founderOpen
          ? 'Entrar antes'
          : 'Ver disponibilidad';
    });

    each(root, '[data-phase-status]', function (element) {
      if (state.phase === PHASE.UNKNOWN && state.error) {
        element.textContent =
          'No hemos podido comprobar el estado ahora mismo. Inténtalo de nuevo en unos minutos.';
      }
    });

    if (root.documentElement && typeof root.documentElement.setAttribute === 'function') {
      root.documentElement.setAttribute('data-agora-phase', state.phase);
    }
    return state;
  }

  /** Cierre recibido del servidor: pasa a próximamente y revela el aviso. */
  function applyClosed(root) {
    var state = {
      phase: PHASE.UPCOMING,
      live: false,
      founderOpen: false,
      signupEnabled: false,
      inviteRequired: false,
      known: true,
      error: false,
      closedByServer: true,
    };
    apply(root, state);
    each(root, '[data-prereg-closed]', function (element) {
      // El aviso puede traer la clase utilitaria `hidden`; hay que retirarla
      // además del atributo para que se vea de verdad tras el 410.
      if (element.classList && typeof element.classList.remove === 'function') {
        element.classList.remove('hidden');
      }
      setHidden(element, false);
    });
    return state;
  }

  /** Carga la config sin lanzar: cualquier fallo se convierte en `unknown`. */
  function loadConfig(configUrl, fetchImpl) {
    var fetcher =
      typeof fetchImpl === 'function'
        ? fetchImpl
        : typeof global.fetch === 'function'
          ? global.fetch.bind(global)
          : null;
    if (!fetcher) return Promise.resolve(unknownState(true));

    return Promise.resolve(fetcher(configUrl, { cache: 'no-store' }))
      .then(function (response) {
        if (!response || response.ok !== true) return unknownState(true);
        return Promise.resolve(response.json())
          .then(function (config) {
            var state = resolveConfig(config);
            // Un 200 con forma inesperada tampoco es un estado conocido.
            if (!state.known) state.error = true;
            return state;
          })
          .catch(function () {
            return unknownState(true);
          });
      })
      .catch(function () {
        return unknownState(true);
      });
  }

  function init(root, configUrl, fetchImpl) {
    return loadConfig(configUrl, fetchImpl).then(function (state) {
      return apply(root, state);
    });
  }

  global.AgoraPhase = {
    PHASE: PHASE,
    STORE_LINKS: STORE_LINKS,
    configure: configure,
    unknownState: unknownState,
    resolveConfig: resolveConfig,
    submitOutcome: submitOutcome,
    apply: apply,
    applyClosed: applyClosed,
    loadConfig: loadConfig,
    init: init,
  };
})(typeof window !== 'undefined' ? window : this);
