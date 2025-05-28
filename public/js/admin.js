// Esperar a que se inicialice la instancia global de socket
let socket;
document.addEventListener('DOMContentLoaded', () => {
    socket = window.socketInstance;
    if (!socket) {
        console.error('No se encontró la instancia global de socket');
        return;
    }
    initializeAdmin();
    initializeTabs();
    loadShadersList();
    loadUsersList();
});

// Variables globales
const connectionsList = document.getElementById('connections-list');
const totalConnections = document.getElementById('total-connections');
let activeConnections = [];
let activeShaders = new Map();

// Manejo de pestañas
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Desactivar todas las pestañas
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Activar la pestaña seleccionada
            tab.classList.add('active');
            const targetId = `${tab.dataset.tab}-tab`;
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// Formateo de fechas
function formatDate(isoDate) {
    if (!isoDate) return 'No disponible';
    try {
        const date = new Date(isoDate);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return 'Error de formato';
    }
}

// Funciones para la pestaña Live
function updateConnectionsList(connections) {
    if (!connectionsList || !connections) return;
    
    console.log('Actualizando lista de conexiones:', connections);
    
    connectionsList.innerHTML = '';
    totalConnections.textContent = `Conexiones activas: ${connections.length}`;
    
    connections.forEach(conn => {
        if (!conn) return;
        
        const connectionCard = document.createElement('div');
        connectionCard.className = 'connection-card';
        
        const connectedTime = Math.floor((new Date() - new Date(conn.connectTime || Date.now())) / 1000);
        const minutes = Math.floor(connectedTime / 60);
        const seconds = connectedTime % 60;
        
        const activeShader = activeShaders.get(conn.id);
        const shaderInfo = activeShader || {};
        
        const shaderLink = shaderInfo.nombre 
            ? `<a href="${CONFIG.BASE_URL}/shader.html?shader=${encodeURIComponent(shaderInfo.nombre)}" target="_blank">${shaderInfo.nombre}</a>` 
            : 'Sin shader activo';
        
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

// Funciones para la pestaña Shaders
async function deleteShader(nombre) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/shaders/${encodeURIComponent(nombre)}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar el shader');
        }

        // Recargar la lista después de eliminar
        loadShadersList();
    } catch (error) {
        console.error('Error al eliminar el shader:', error);
        alert('Error al eliminar el shader. Por favor, intente nuevamente.');
    }
}

async function loadShadersList() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/shaders`);
        if (!response.ok) throw new Error('Error al cargar shaders');
        
        const shaders = await response.json();
        const tbody = document.querySelector('#shaders-table tbody');
        tbody.innerHTML = '';
        
        shaders.forEach(shader => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${CONFIG.API_URL}/img/previews/${shader.nombre}.png" 
                         alt="Preview de ${shader.nombre}" 
                         class="shader-preview-img"
                         onerror="this.src='img/default-preview.png'">
                </td>
                <td>${shader.nombre}</td>
                <td>${shader.autor}</td>
                <td>
                    <div class="code-preview">${shader.contenido}</div>
                </td>
                <td>
                    <button class="delete-btn" onclick="deleteShader('${shader.nombre}')">
                        🗑️ Eliminar
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar la lista de shaders:', error);
    }
}

// Funciones para la pestaña Users
async function loadUsersList() {
    try {
        const url = `${CONFIG.API_URL}/api/users`;
        console.log('1. URL de la petición:', url);
        
        const response = await fetch(url);
        console.log('2. Response status:', response.status);
        console.log('3. Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) throw new Error('Error al cargar usuarios');
        
        const responseText = await response.text();
        console.log('4. Response text:', responseText);
        
        const users = JSON.parse(responseText);
        console.log('5. Parsed users:', users);
        
        // Verificar la estructura de cada usuario
        users.forEach((user, index) => {
            console.log(`Usuario ${index}:`, user);
            console.log('Campos disponibles:', Object.keys(user));
            console.log('promptsRemaining:', user.promptsRemaining);
        });
        
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            console.log('User data:', JSON.stringify(user, null, 2));
            const row = document.createElement('tr');
            const formattedDate = user.registerDate ? formatDate(user.registerDate) : 'No disponible';
            console.log('Formatted date:', formattedDate);
            
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${formattedDate}</td>
                <td>${user.promptsRemaining !== undefined ? user.promptsRemaining : 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar la lista de usuarios:', error);
        const tbody = document.querySelector('#users-table tbody');
        tbody.innerHTML = '<tr><td colspan="2">Error al cargar usuarios</td></tr>';
    }
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
        console.log('Shader update recibido:', data);
        
        activeShaders.set(data.id, {
            nombre: data.nombre,
            autor: data.autor,
            contenido: data.contenido,
            lastUpdate: new Date()
        });
        
        updateConnectionsList(activeConnections);
    });

    // Actualizar listas periódicamente
    setInterval(() => {
        loadShadersList();
        loadUsersList();
    }, 30000); // Actualizar cada 30 segundos
}