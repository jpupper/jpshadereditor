// Configuración del servidor
const config = require('./env-config');

module.exports = {
    // Configuración de la base de datos
    DB_URL: config.SERVER.DB_URL,
    DB_NAME: config.SERVER.DB_NAME,
    
    // Configuración del servidor
    PORT: config.SERVER.PORT,
    BASE_URL: config.SERVER.BASE_URL,
    
    // Configuración de WebSocket
    SOCKET_PATH: config.SERVER.BASE_URL + '/socket.io',
    
    // Otras configuraciones
    UPLOAD_DIR: config.SERVER.UPLOAD_DIR || './uploads',
    MAX_FILE_SIZE: config.SERVER.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB por defecto
    
    // Configuración de seguridad
    CORS_ORIGIN: config.SERVER.CORS_ORIGIN || '*',
    RATE_LIMIT: config.SERVER.RATE_LIMIT || {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100 // límite de 100 solicitudes por ventana
    }
};
