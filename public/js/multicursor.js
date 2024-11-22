// Sistema de multicursores para el editor colaborativo
let cursorMarkers = new Map(); // Almacena los marcadores de cursores por usuario
let userColors = new Map(); // Almacena los colores asignados a cada usuario

// Colores predefinidos para los cursores de usuarios
const cursorColors = [
    '#FF4136', // Rojo
    '#2ECC40', // Verde
    '#0074D9', // Azul
    '#B10DC9', // Púrpura
    '#FF851B', // Naranja
    '#39CCCC', // Turquesa
    '#F012BE', // Magenta
    '#01FF70'  // Lima
];

// Inicializar el sistema de multicursores
function initMultiCursor(editor) {
    // Escuchar cambios de posición del cursor local
    editor.on('cursorActivity', () => {
        const pos = editor.getCursor();
        const username = localStorage.getItem('username');
        if (username) {
            socket.emit('cursorMove', {
                username: username,
                position: { line: pos.line, ch: pos.ch }
            });
        }
    });

    // Escuchar actualizaciones de cursores remotos
    socket.on('cursorUpdate', (data) => {
        updateRemoteCursor(editor, data.username, data.position);
    });

    // Limpiar cursor cuando un usuario se desconecta
    socket.on('userDisconnected', (username) => {
        removeUserCursor(editor, username);
    });
}

// Actualizar la posición del cursor de un usuario remoto
function updateRemoteCursor(editor, username, position) {
    if (username === localStorage.getItem('username')) return; // Ignorar cursor propio

    // Eliminar marcador anterior si existe
    if (cursorMarkers.has(username)) {
        cursorMarkers.get(username).clear();
    }

    // Asignar color al usuario si no tiene uno
    if (!userColors.has(username)) {
        const color = cursorColors[userColors.size % cursorColors.length];
        userColors.set(username, color);
    }

    // Crear elemento del cursor
    const cursorElement = document.createElement('div');
    cursorElement.className = 'remote-cursor';
    cursorElement.style.backgroundColor = userColors.get(username);
    cursorElement.innerHTML = `
        <div class="cursor-flag" style="background-color: ${userColors.get(username)}">
            ${username}
        </div>
    `;

    // Crear marcador en el editor
    const marker = editor.setBookmark(position, {
        widget: cursorElement,
        insertLeft: true
    });

    cursorMarkers.set(username, marker);
}

// Eliminar el cursor de un usuario
function removeUserCursor(editor, username) {
    if (cursorMarkers.has(username)) {
        cursorMarkers.get(username).clear();
        cursorMarkers.delete(username);
        userColors.delete(username);
    }
}
