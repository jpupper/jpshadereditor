const socket = io();
const connectionsList = document.getElementById('connections-list');
const totalConnections = document.getElementById('total-connections');

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
    connectionsList.innerHTML = '';
    totalConnections.textContent = `Conexiones activas: ${connections.length}`;
    
    connections.forEach(conn => {
        const connectionCard = document.createElement('div');
        connectionCard.className = 'connection-card';
        
        // Calcular tiempo de conexión
        const connectedTime = Math.floor((new Date() - new Date(conn.connectTime)) / 1000);
        const minutes = Math.floor(connectedTime / 60);
        const seconds = connectedTime % 60;
        
        // Crear el hipervínculo para el shader
        const shaderLink = `<a href="/?shader=${encodeURIComponent(conn.shaderInfo.nombre)}" target="_blank">${conn.shaderInfo.nombre}</a>`;
        
        connectionCard.innerHTML = `
            <div class="connection-info">
                <div class="connection-details">
                    <div class="connection-id">ID: ${conn.id}</div>
                    <div class="connection-origin">Origen: ${conn.origin}</div>
                    <div class="connection-status ${conn.isEditing ? 'editing' : ''}">
                        ${conn.isEditing ? '🖊️ Editando' : '👀 Observando'}
                    </div>
                    <div class="connection-shader">Shader: ${shaderLink}</div>
                    <div class="connection-author">Autor: ${conn.shaderInfo ? conn.shaderInfo.autor : 'N/A'}</div>
                    <div class="connection-content">Contenido: ${conn.shaderInfo ? conn.shaderInfo.contenido : 'N/A'}</div>
                </div>
                <div class="connection-time">
                    <div>Conectado hace: ${minutes}m ${seconds}s</div>
                    <div>Última actividad: ${formatDate(conn.lastActivity)}</div>
                </div>
            </div>
        `;
        connectionsList.appendChild(connectionCard);
    });
}

// Actualizar la lista cada segundo para mantener el tiempo actualizado
setInterval(() => {
    fetch('/api/connections')
        .then(response => response.json())
        .then(updateConnectionsList)
        .catch(console.error);
}, 1000);

// Escuchar eventos de conexión
socket.on('connect', () => {
    console.log('Panel de administración conectado');
});

socket.on('disconnect', () => {
    console.log('Panel de administración desconectado');
    totalConnections.textContent = 'Desconectado del servidor...';
});

// Escuchar actualizaciones de conexiones
socket.on('connectionsUpdate', (connections) => {
    updateConnectionsList(connections);
});

// Escuchar actualizaciones de shader
socket.on('shaderUpdate', (data) => {
    console.log('Shader actualizado recibido en el panel de administración:', data);
    
    // Actualizar la información de la conexión correspondiente
    const connection = Array.from(activeConnections.values()).find(conn => conn.id === data.id);
    if (connection) {
        connection.shaderInfo = {
            nombre: data.nombre,
            autor: data.autor,
            contenido: data.contenido
        };
        // Llamar a updateConnectionsList para reflejar los cambios
        updateConnectionsList(Array.from(activeConnections.values()));
    }
});