(function () {
  'use strict';
  const config = window.ADE_CONFIG || {};
  const staticMode = config.mode === 'pages' || location.hostname.endsWith('.github.io');
  const apiBase = String(config.apiBase || '').replace(/\/+$/, '');
  if (apiBase && (!/^https:\/\/[^\s]+$/i.test(apiBase) || new URL(apiBase).username || new URL(apiBase).password || new URL(apiBase).search || new URL(apiBase).hash)) throw new Error('La URL pública del servidor debe usar HTTPS, sin credenciales ni parámetros.');
  window.AdeRuntime = Object.freeze({
    staticMode, apiBase, backendAvailable: !staticMode || Boolean(apiBase),
    normalizeContent(value) {
      const visit = node => {
        if (typeof node === 'string') return apiBase ? node.replace(/(^|[;\s])\/uploads\/([a-f0-9]{40}\.(?:png|jpg|webp|pdf))/g, '$1'+apiBase+'/uploads/$2') : node;
        if (Array.isArray(node)) return node.map(visit);
        if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([key,item])=>[key,visit(item)]));
        return node;
      };
      return visit(value);
    },
    apiUrl(path) {
      if (!/^\/api\//.test(path)) throw new Error('Ruta de servicio inválida.');
      if (apiBase) return apiBase + path;
      if (staticMode) throw new Error('Este servicio aún no está conectado en esta publicación. Tus datos personales siguen guardados.');
      return path;
    }
  });
})();
