/* ══════════════════════════════════════════════════════════════════
   CIERRE DE EXÁMENES — fuente única de fechas

   Cada examen se cierra al final del día indicado (23:59, hora de
   Colombia). Un examen cerrado:
     · aparece en gris y sin enlace en la página de inicio;
     · bloquea su propia página si alguien entra con el enlace directo.

   Para reabrir o aplazar un examen, cambia aquí su fecha.
   La clave es la misma ruta que usa el catálogo de index.html.
══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CIERRES = {
    'tecnico/index.html?curso=db':                            '2026-06-14',
    'tecnico/index.html?curso=web2':                          '2026-06-14',
    'tecnico/ingles-2/examen-recuperacion/index.html':        '2026-06-14',
    'tecnico/web2-backend/parcial-unidad-1/index.html':       '2026-09-20',
    'tecnico/proyecto-web/parcial-teorico/index.html':        '2026-10-10',
    'tecnico/web2-backend/examen-final/index.html':           '2026-11-29',
    'sistemas/programacion-3/examen-recuperacion/index.html': '2026-06-14',
  };

  var ZONA = '-05:00';   // Colombia

  function limite(fecha) { return new Date(fecha + 'T23:59:59' + ZONA); }

  function fechaDe(href) { return CIERRES[href] || null; }

  function cerrado(href) {
    var f = CIERRES[href];
    return !!f && Date.now() > limite(f).getTime();
  }

  function legible(fecha) {
    if (!fecha) return '';
    try {
      return new Intl.DateTimeFormat('es-CO', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota',
      }).format(limite(fecha));
    } catch (_) {
      var p = fecha.split('-');
      return p[2] + '/' + p[1] + '/' + p[0];
    }
  }

  window.Cierres = { fecha: fechaDe, cerrado: cerrado, legible: legible };

  /* ───── Guard: bloquea esta página si es un examen ya cerrado ───── */

  function claveActual() {
    var ruta  = location.pathname.replace(/\/index\.html$/, '/');
    if (ruta.slice(-1) !== '/') ruta += '/';
    var curso = new URLSearchParams(location.search).get('curso');

    for (var href in CIERRES) {
      var partes     = href.split('?');
      var carpeta    = partes[0].replace(/index\.html$/, '');
      var cursoClave = partes[1] ? new URLSearchParams(partes[1]).get('curso') : null;
      if (ruta.slice(-(carpeta.length + 1)) === '/' + carpeta && cursoClave === curso) return href;
    }
    return null;
  }

  function rutaAlInicio(href) {
    var niveles = href.split('?')[0].replace(/index\.html$/, '').split('/').filter(Boolean).length;
    return new Array(niveles + 1).join('../') + 'index.html';
  }

  function bloquear(href) {
    var aviso = document.createElement('div');
    aviso.id = 'examen-cerrado';
    aviso.innerHTML =
      '<div class="ec-caja">' +
        '<div class="ec-icono" aria-hidden="true">' +
          '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
          '</svg>' +
        '</div>' +
        '<h1>Examen cerrado</h1>' +
        '<p>Este examen dejó de estar disponible el <strong>' + legible(fechaDe(href)) + '</strong>. ' +
        'Si necesitas presentarlo, habla con la docente.</p>' +
        '<a class="ec-btn" href="' + rutaAlInicio(href) + '">Volver al inicio</a>' +
      '</div>';

    var css = document.createElement('style');
    css.textContent =
      '#examen-cerrado{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
      'padding:1.5rem;background:#f3f5f4;' +
      "font-family:'IBM Plex Sans','Segoe UI',system-ui,-apple-system,sans-serif;color:#18201e;line-height:1.6}" +
      '#examen-cerrado .ec-caja{background:#fff;border:1px solid #dfe5e3;border-radius:14px;padding:2.25rem 1.75rem;' +
      'max-width:420px;width:100%;text-align:center;box-shadow:0 6px 28px rgba(0,0,0,.08)}' +
      '#examen-cerrado .ec-icono{width:66px;height:66px;margin:0 auto 1.1rem;border-radius:50%;background:#eceeed;' +
      'color:#6b7472;display:flex;align-items:center;justify-content:center}' +
      '#examen-cerrado h1{font-size:1.35rem;font-weight:700;margin:0 0 .5rem}' +
      '#examen-cerrado p{font-size:.93rem;color:#66706d;margin:0 0 1.5rem}' +
      '#examen-cerrado .ec-btn{display:inline-block;background:#0f5e56;color:#fff;text-decoration:none;font-weight:600;' +
      'font-size:.93rem;padding:.65rem 1.6rem;border-radius:9px}' +
      '#examen-cerrado .ec-btn:hover{opacity:.9}';

    document.head.appendChild(css);
    document.body.appendChild(aviso);

    // El examen queda detrás del aviso y sin recibir clics ni foco.
    var hijos = document.body.children;
    for (var i = 0; i < hijos.length; i++) {
      if (hijos[i] !== aviso) hijos[i].inert = true;
    }
    document.body.style.overflow = 'hidden';
    document.title = 'Examen cerrado';
  }

  var href = claveActual();
  if (href && cerrado(href)) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { bloquear(href); });
    } else {
      bloquear(href);
    }
  }
})();
