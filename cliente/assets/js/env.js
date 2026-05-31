// env.js — configuración compartida de rutas frontend/backend
(function () {
    const origin = window.location.origin;
    const partes = window.location.pathname.split('/').filter(Boolean);
    const idxCliente = partes.indexOf('cliente');
    const prefijoPartes = idxCliente > 0 ? partes.slice(0, idxCliente).join('/') : '';
    const prefijoProyecto = prefijoPartes ? `/${prefijoPartes}` : '';
    const backendPath = prefijoProyecto ? `${prefijoProyecto}/servidor/api` : '/servidor/api';

    window.PROJECT_BASE = prefijoProyecto;
    window.API_BASE = `${origin}${backendPath}`;
})();