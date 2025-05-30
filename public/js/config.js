const CONFIG = {
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    get API_URL() {
        //return this.isLocal ? 'http://localhost:3250/shader' : 'https://vps-4455523-x.dattaweb.com/shader';
        return 'https://vps-4455523-x.dattaweb.com/shader';
    },
    get SOCKET_URL() {
        return this.isLocal ? 'http://localhost:3250' : 'https://vps-4455523-x.dattaweb.com';
    },
    get BASE_URL() {
        return this.isLocal ? '/shader' : '/jpshadereditor';
    },
    // API Key para OpenAI - NO incluir la clave real aquí
    // Reemplazar con tu propia clave antes de usar
    openaiApiKey: ''
};

// Exponer la configuración globalmente
window.config = CONFIG;