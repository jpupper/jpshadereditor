// Esperar a que se inicialice la instancia global de socket
let socket;
document.addEventListener('DOMContentLoaded', () => {
    socket = window.socketInstance;
    if (!socket) {
        console.error('No se encontró la instancia global de socket');
        return;
    }
    initializeAdmin();
});

const connectionsList = document.getElementById('connections-list');
const totalConnections = document.getElementById('total-connections');

// Variable para almacenar las conexiones activas y sus shaders
let activeConnections = [];
let activeShaders = new Map(); // Mapa para mantener el estado de los shaders

function formatDate(date) {
    return new Date(date).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function updateConnectionsList(connections) {
    if (!connectionsList || !connections) return;
    
    console.log('Actualizando lista de conexiones:', connections);
    
    connectionsList.innerHTML = '';
    totalConnections.textContent = `Conexiones activas: ${connections.length}`;
    
    connections.forEach(conn => {
        if (!conn) return;
        
        const connectionCard = document.createElement('div');
        connectionCard.className = 'connection-card';
        
        // Calcular tiempo de conexión
        const connectedTime = Math.floor((new Date() - new Date(conn.connectTime || Date.now())) / 1000);
        const minutes = Math.floor(connectedTime / 60);
        const seconds = connectedTime % 60;
        
        // Obtener información del shader activo para esta conexión
        const activeShader = activeShaders.get(conn.id);
        const shaderInfo = activeShader || {};
        
        // Crear el hipervínculo para el shader
        const shaderLink = shaderInfo.nombre 
            ? `<a href="shader.html?shader=${encodeURIComponent(shaderInfo.nombre)}" target="_blank">${shaderInfo.nombre}</a>` 
            : 'Sin shader activo';
        
        // Truncar el contenido si es muy largo
        const contentPreview = shaderInfo.contenido 
            ? shaderInfo.contenido.substring(0, 50) + (shaderInfo.contenido.length > 50 ? '...' : '')
            : 'N/A';
        
        connectionCard.innerHTML = `
            <div class="connection-info">
                <div class="connection-details">
                    <div class="connection-id">ID: ${conn.id || 'N/A'}</div>
                    <div class="connection-origin">Origen: ${conn.origin || 'Desconocido'}</div>
                    <div class="connection-status ${conn.isEditing ? 'editing' : ''}">
                        ${conn.isEditing ? '🖊️ Editando' : '👀 Observando'}
                    </div>
                    <div class="connection-shader"><strong>Shader:</strong> ${shaderLink}</div>
                    <div class="connection-author"><strong>Autor:</strong> ${shaderInfo.autor || 'N/A'}</div>
                    <div class="connection-content"><strong>Contenido:</strong> ${contentPreview}</div>
                </div>
                <div class="connection-time">
                    <div>Conectado hace: ${minutes}m ${seconds}s</div>
                    <div>Última actividad: ${formatDate(conn.lastActivity || Date.now())}</div>
                </div>
            </div>
        `;
        connectionsList.appendChild(connectionCard);
    });
}

function initializeAdmin() {
    // Actualizar la lista cada segundo para mantener el tiempo actualizado
    setInterval(() => {
        fetch(CONFIG.API_URL + '/api/connections')
            .then(response => response.json())
            .then(connections => {
                activeConnections = connections;
                updateConnectionsList(connections);
            })
            .catch(console.error);
    }, 1000);

    // Escuchar eventos de conexión
    socket.on('connect', () => {
        console.log('Panel de administración conectado');
        socket.emit("pedirShader");
    });

    socket.on('disconnect', () => {
        console.log('Panel de administración desconectado');
        totalConnections.textContent = 'Desconectado del servidor...';
    });

    // Escuchar actualizaciones de shader
    socket.on('shaderUpdate', (data) => {
        console.log('==================== SHADER UPDATE RECIBIDO ====================');
        console.log('Data completa recibida:', data);
        
        // Actualizar el mapa de shaders activos
        activeShaders.set(data.id, {
            nombre: data.nombre,
            autor: data.autor,
            contenido: data.contenido,
            lastUpdate: new Date()
        });
        
        // Forzar actualización inmediata de la UI
        updateConnectionsList(activeConnections);
    });
}