// Configuración de Socket.IO para la aplicación de shaders
(function() {
    // Configurar la conexión de socket
    const socket = window.io(CONFIG.SOCKET_URL, {
        path: '/shader/socket.io'
    });

    // Manejar conexión
    socket.on('connect', () => {
        console.log('Conectado al servidor de sockets:', socket.id);
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
        console.log('Desconectado del servidor de sockets');
    });

    // Evento para recibir actualizaciones de shaders
    socket.on('shaderUpdate', (data) => {
       /* console.log('Actualización de shader recibida:', data);
        
        // Intentar actualizar sin tantas verificaciones
        try {
            const shaderDropdown = document.getElementById('shader-dropdown');
            const currentShaderName = shaderDropdown ? shaderDropdown.value : null;

            if (!currentShaderName || data.nombre === currentShaderName) {
                // Desactivar la bandera de cambio de usuario durante la actualización
                window.isUserChange = false;
                
                // Intentar actualizar campos
                ['', '-fullscreen'].forEach(suffix => {
                    const nombreInput = document.getElementById(`shader-name${suffix}`);
                    const autorInput = document.getElementById(`shader-author${suffix}`);
                    const editorInstance = suffix === '' ? editor : fullscreenEditor;

                    if (nombreInput) nombreInput.value = data.nombre;
                    if (autorInput) autorInput.value = data.autor;
                    if (editorInstance && data.contenido) {
                        editorInstance.setValue(data.contenido);
                        if (data.cursorPos) {
                            editorInstance.setCursor(data.cursorPos);
                        }
                    }
                });

                // Reactivar la bandera de cambio de usuario después de la actualización
                window.isUserChange = true;
            }
        } catch (error) {
            console.error('Error al actualizar el shader:', error);
            window.isUserChange = true; // Asegurarse de reactivar la bandera incluso si hay error
        }*/
    });

    // Función para emitir actualizaciones de shader
    window.emitShaderUpdate = function(nombre, autor, contenido, cursorPos) {
       
        console.log("EMITIR SHADER");
        socket.emit('shaderUpdate', {
            nombre: nombre,
            autor: autor,
            contenido: contenido,
            cursorPos: cursorPos
        });
    };

    // Exponer socket globalmente
    window.socketInstance = socket;
})();
