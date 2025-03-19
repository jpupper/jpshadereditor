// api-config.js
const path = require('path');
const fs = require('fs');

// Intentar cargar las claves de API desde api-keys.js
let apiKeys = {
    openai: {
        apiKey: '',
        apiUrl: 'https://api.openai.com/v1/chat/completions'
    }
};

try {
    // Verificar si el archivo api-keys.js existe
    if (fs.existsSync(path.join(__dirname, 'api-keys.js'))) {
        // Cargar las claves de API desde api-keys.js
        apiKeys = require('./api-keys');
        console.log('✅ Claves de API cargadas correctamente desde api-keys.js');
    } else {
        console.warn('⚠️ El archivo api-keys.js no existe. Algunas funcionalidades pueden no estar disponibles.');
    }
} catch (error) {
    console.error('Error al cargar las claves de API:', error);
}

// Configuración de API keys
const apiConfig = {
    openai: {
        apiKey: apiKeys.openai.apiKey || '',
        apiUrl: apiKeys.openai.apiUrl || 'https://api.openai.com/v1/chat/completions'
    }
};

// Función para verificar si las claves de API están configuradas
const validateApiKeys = () => {
    const missingKeys = [];
    
    if (!apiConfig.openai.apiKey) {
        missingKeys.push('API Key de OpenAI');
    }
    
    if (missingKeys.length > 0) {
        console.warn(`⚠️ Advertencia: Las siguientes claves de API no están configuradas: ${missingKeys.join(', ')}`);
        console.warn('Algunas funcionalidades pueden no estar disponibles.');
    } else {
        console.log('✅ Todas las claves de API están configuradas correctamente.');
    }
};

module.exports = {
    apiConfig,
    validateApiKeys
};
