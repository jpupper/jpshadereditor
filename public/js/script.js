let canvas, gl, buffer, currentProgram, vertexPosition, screenVertexPosition;
let parameters = { startTime: Date.now(), time: 0, mouseX: 0.5, mouseY: 0.5, screenWidth: 0, screenHeight: 0, fxrand: Math.random() };
let surface = { centerX: 0, centerY: 0, width: 1, height: 1, lastX: 0, lastY: 0 };
let frontTarget, backTarget, screenProgram;
let editor, fullscreenEditor, errorDisplay, fullscreenErrorDisplay;
let isFullscreen = false;
let lastValidProgram = null;
const socket = io();
let isBroadcastingUpdate = false;

init();
animate();

function init() {
    inicializarElementosDOM();
    inicializarContextosWebGL();
    inicializarEditores();
    
    // Inicializar conexión Socket.IO
    socket.on('connect', () => {
        console.log('Conectado al servidor:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('Desconectado del servidor');
    });
    
    if (!gl) {
        alert("WebGL no está soportado, pero se mostrará el código.");
        return;
    }

    inicializarWebGL();
    configurarEventos();
    onWindowResize();
    window.addEventListener('resize', onWindowResize, false);

    cargarShaderDesdeURL();

    // Cargar los shaders inmediatamente
    console.log('Iniciando carga de shaders...'); // Debug log
    fetchShaders();
    
    // Configurar el evento change del dropdown
    document.getElementById('shader-dropdown').addEventListener('change', setActiveShader);
    document.getElementById('shader-dropdown-fullscreen').addEventListener('change', setActiveShader);
}

function inicializarElementosDOM() {
    canvas = document.getElementById('glsl-canvas');
    errorDisplay = document.getElementById('error-display');
    fullscreenErrorDisplay = document.getElementById('fullscreen-error-display');
    
    // Añadir eventos para guardar shaders
    const saveButton = document.getElementById('save-shader');
    const saveButtonFullscreen = document.getElementById('save-shader-fullscreen');
    
    if (saveButton) {
        saveButton.addEventListener('click', saveShader);
    }
    
    if (saveButtonFullscreen) {
        saveButtonFullscreen.addEventListener('click', saveShader);
    }
}

function inicializarContextosWebGL() {
    try {
        gl = canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
    } catch (error) {
        console.error("Error al inicializar WebGL:", error);
    }
}

function inicializarWebGL() {
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0]), gl.STATIC_DRAW);

    surface.buffer = gl.createBuffer();

    createRenderTargets();
    compile();
}

function inicializarEditores() {
    editor = CodeMirror.fromTextArea(document.getElementById("glsl-editor"), {
        mode: "x-shader/x-fragment",
        theme: "monokai",
        lineNumbers: true,
        matchBrackets: true
    });

    fullscreenEditor = CodeMirror(document.getElementById("fullscreen-editor"), {
        mode: "x-shader/x-fragment",
        theme: "monokai",
        lineNumbers: true
    });
}

function configurarEventos() {
    canvas.addEventListener('mousedown', function (event) {
        surface.lastX = event.clientX;
        surface.lastY = event.clientY;
        event.preventDefault();
    }, false);

    canvas.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    }, false);

    document.addEventListener('mousemove', function (event) {
        parameters.mouseX = event.clientX / window.innerWidth;
        parameters.mouseY = 1 - event.clientY / window.innerHeight;
    }, false);

    editor.on("change", compile);
    fullscreenEditor.on("change", compile);

    document.getElementById('fullscreen-button').addEventListener('click', entrarPantallaCompleta);
    document.getElementById('exit-fullscreen').addEventListener('click', salirPantallaCompleta);
    document.getElementById('toggle-editor').addEventListener('click', toggleEditor);
    document.getElementById('open-editor').addEventListener('click', toggleEditor);
}

async function cargarShaderDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const shaderName = params.get('shader') || 'default';
    const isNewShader = params.get('newShader') === 'true';
    
    try {
        let shader;
        
        if (isNewShader) {
            // Para un nuevo shader, usar el contenido del shader default
            const defaultResponse = await fetch('/api/shaders/default');
            if (!defaultResponse.ok) {
                throw new Error('No se pudo cargar el shader default');
            }
            const defaultShader = await defaultResponse.json();
            
            // Crear un nuevo shader con el contenido default
            shader = {
                nombre: shaderName,
                autor: localStorage.getItem('username') || 'Anónimo',
                contenido: defaultShader.contenido
            };
        } else {
            // Cargar shader existente
            const response = await fetch(`/api/shaders/${shaderName}`);
            if (!response.ok) {
                throw new Error(`No se pudo cargar el shader ${shaderName}`);
            }
            shader = await response.json();
        }
        
        // Actualizar campos de nombre y autor
        ['', '-fullscreen'].forEach(suffix => {
            document.getElementById(`shader-name${suffix}`).value = shader.nombre;
            document.getElementById(`shader-author${suffix}`).value = shader.autor;
        });

        // Actualizar editores
        editor.setValue(shader.contenido);
        fullscreenEditor.setValue(shader.contenido);
        
        // Actualizar dropdowns
        ['shader-dropdown', 'shader-dropdown-fullscreen'].forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.value = shader.nombre;
            }
        });

        compile();
    } catch (error) {
        console.error('Error cargando shader desde URL:', error);
        mostrarError('Error', 'No se pudo cargar el shader especificado');
    }
}

function actualizarURL(nombreShader) {
    const newUrl = nombreShader 
        ? `${window.location.pathname}?shader=${encodeURIComponent(nombreShader)}`
        : window.location.pathname;
    
    window.history.pushState({ shader: nombreShader }, '', newUrl);
}

function onWindowResize() {
    ajustarTamanoCanvas(canvas);
}

function compile() {
    let program = gl.createProgram();
    let fragment = isFullscreen ? fullscreenEditor.getValue() : editor.getValue();
    let vertex = document.getElementById('surfaceVertexShader').textContent;

    let vs = createShader(vertex, gl.VERTEX_SHADER);
    let fs = createShader(fragment, gl.FRAGMENT_SHADER);

    if (vs == null || fs == null) return null;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        mostrarError('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }

    if (currentProgram) {
        gl.deleteProgram(currentProgram);
    }

    currentProgram = program;
    lastValidProgram = program;

    cacheUniformLocation(program, 'time');
    cacheUniformLocation(program, 'mouse');
    cacheUniformLocation(program, 'resolution');
    cacheUniformLocation(program, 'backbuffer');
    cacheUniformLocation(program, 'fxrand');

    vertexPosition = gl.getAttribLocation(currentProgram, "position");
    gl.enableVertexAttribArray(vertexPosition);

    // Limpiar el mensaje de error si la compilación fue exitosa
    mostrarError('', '');

    // Emitir evento de edición con todos los datos necesarios
    
    if(!isBroadcastingUpdate)
    socket.emit('shaderUpdate', {
        id: socket.id,
        nombre: document.getElementById('shader-name').value, // Obtener el nombre del shader
        autor: document.getElementById('shader-author').value, // Obtener el autor del shader
        contenido: fragment, // Incluir el contenido del shader
        timestamp: new Date() // Mantener el timestamp
    });
}

function cacheUniformLocation(program, label) {
    if (!program.uniformsCache) {
        program.uniformsCache = {};
    }
    program.uniformsCache[label] = gl.getUniformLocation(program, label);
}

function createShader(src, type) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const errorInfo = gl.getShaderInfoLog(shader);
        mostrarError(`${type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT'} SHADER ERROR`, errorInfo || 'Unknown error');
        return null;
    }

    return shader;
}

function createTarget(width, height) {
    let target = {};
    target.framebuffer = gl.createFramebuffer();
    target.texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return target;
}

function createRenderTargets() {
    frontTarget = createTarget(parameters.screenWidth, parameters.screenHeight);
    backTarget = createTarget(parameters.screenWidth, parameters.screenHeight);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    if (!currentProgram) return;

    parameters.time = Date.now() - parameters.startTime;

    gl.useProgram(currentProgram);

    gl.uniform1f(currentProgram.uniformsCache['time'], parameters.time / 1000);
    gl.uniform2f(currentProgram.uniformsCache['mouse'], parameters.mouseX, parameters.mouseY);
    gl.uniform2f(currentProgram.uniformsCache['resolution'], parameters.screenWidth, parameters.screenHeight);
    gl.uniform1f(currentProgram.uniformsCache['fxrand'], parameters.fxrand);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backTarget.texture);
    gl.uniform1i(currentProgram.uniformsCache['backbuffer'], 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, frontTarget.framebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    let temp = frontTarget;
    frontTarget = backTarget;
    backTarget = temp;
}

function mostrarError(mensaje, info) {
    const errorMsg = info ? `${mensaje}: ${info}` : mensaje;
    if (isFullscreen) {
        fullscreenErrorDisplay.textContent = errorMsg;
    } else {
        errorDisplay.textContent = errorMsg;
    }
   // console.error(errorMsg);
}

function entrarPantallaCompleta() {
    isFullscreen = true;
    document.getElementById('fullscreen-container').style.display = 'flex';
    fullscreenEditor.setValue(editor.getValue());

    const fullscreenCanvas = document.getElementById('glsl-canvas-fullscreen');
    if (fullscreenCanvas) {
        ajustarTamanoCanvas(fullscreenCanvas);
        gl = fullscreenCanvas.getContext('webgl');
        if (gl) {
            gl.viewport(0, 0, fullscreenCanvas.width, fullscreenCanvas.height);
            inicializarWebGL();
        }
    } else {
        console.error('No se pudo encontrar el elemento glsl-canvas-fullscreen');
    }

    compile();

    document.getElementById('exit-fullscreen').style.display = esMobile() ? 'none' : 'block';
    document.getElementById('toggle-editor').style.display = 'block';
    document.getElementById('open-editor').style.display = 'none';
}

function manejarCambioOrientacion() {
    if (esMobile()) {
        if (!isFullscreen) {
            entrarPantallaCompleta();
        }
        document.getElementById('fullscreen-button').style.display = 'none';
        document.getElementById('exit-fullscreen').style.display = 'none';
    } else {
        document.getElementById('fullscreen-button').style.display = isFullscreen ? 'none' : 'block';
        document.getElementById('exit-fullscreen').style.display = isFullscreen ? 'block' : 'none';
    }
    ajustarTamanoCanvas(isFullscreen ? document.getElementById('glsl-canvas-fullscreen') : canvas);
}

function salirPantallaCompleta() {
    if (esMobile()) return;

    isFullscreen = false;
    document.getElementById('fullscreen-container').style.display = 'none';
    editor.setValue(fullscreenEditor.getValue());

    canvas = document.getElementById('glsl-canvas');
    gl = canvas.getContext('webgl');
    
    ajustarTamanoCanvas(canvas);
    
    inicializarWebGL();
    compile();
}

function ajustarTamanoCanvas(canvasElement) {
    const container = isFullscreen ? document.documentElement : document.getElementById('canvas-container');
    const rect = container.getBoundingClientRect();
    const displayWidth = Math.floor(rect.width);
    const displayHeight = Math.floor(rect.height);

    canvasElement.width = displayWidth;
    canvasElement.height = displayHeight;

    canvasElement.style.width = `${displayWidth}px`;
    canvasElement.style.height = `${displayHeight}px`;

    gl.viewport(0, 0, canvasElement.width, canvasElement.height);

    parameters.screenWidth = canvasElement.width;
    parameters.screenHeight = canvasElement.height;

    createRenderTargets(gl);
}

function esMobile() {
    return window.innerHeight > window.innerWidth;
}

function toggleEditor() {
    const editorElement = document.getElementById('fullscreen-editor-container');
    const toggleButton = document.getElementById('toggle-editor');
    const openButton = document.getElementById('open-editor');
    const shaderSaveControls = document.getElementById('shader-controls-fullscreen');

    if (editorElement.style.display !== 'none') {
        editorElement.style.display = 'none';
        toggleButton.style.display = 'none';
        openButton.style.display = 'block';
        shaderSaveControls.style.display = 'none';
    } else {
        editorElement.style.display = 'flex';
        toggleButton.style.display = 'block';
        openButton.style.display = 'none';
        shaderSaveControls.style.display = 'flex';
    }
}

function fetchShaders() {
    console.log('Iniciando fetchShaders...');
    
    fetch('/api/shaders')
        .then(async response => {
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(shaders => {
            console.log('Shaders recibidos:', shaders);
            
            // Actualizar ambos dropdowns
            ['shader-dropdown', 'shader-dropdown-fullscreen'].forEach(dropdownId => {
                const dropdown = document.getElementById(dropdownId);
                if (!dropdown) {
                    console.error(`No se encontró el elemento ${dropdownId}`);
                    return;
                }
                
                dropdown.innerHTML = '<option value="">Selecciona un shader</option>';
                
                if (Array.isArray(shaders)) {
                    shaders.forEach(shader => {
                        if (shader && shader.nombre) {
                            const option = document.createElement('option');
                            option.value = shader.nombre;
                            option.textContent = shader.nombre;
                            dropdown.appendChild(option);
                        }
                    });
                }
            });
        })
        .catch(error => {
            console.error('Error completo en fetchShaders:', error);
            ['shader-dropdown', 'shader-dropdown-fullscreen'].forEach(dropdownId => {
                const dropdown = document.getElementById(dropdownId);
                if (dropdown) {
                    dropdown.innerHTML = '<option value="">Error al cargar shaders</option>';
                }
            });
        });
}

function setActiveShader(event) {
    const shaderName = event.target.value;
    if (!shaderName) return;

    // Sincronizar la selección en ambos dropdowns
    const otherDropdownId = event.target.id === 'shader-dropdown' ? 
        'shader-dropdown-fullscreen' : 'shader-dropdown';
    document.getElementById(otherDropdownId).value = shaderName;

    // Actualizar la URL
    actualizarURL(shaderName);

    // Fetch the shader code and metadata from the server
    fetch(`/api/shaders/${shaderName}`)
        .then(response => response.json())
        .then(shader => {
            // Actualizar campos de nombre y autor en ambas vistas
            ['', '-fullscreen'].forEach(suffix => {
                document.getElementById(`shader-name${suffix}`).value = shader.nombre;
                document.getElementById(`shader-author${suffix}`).value = shader.autor;
            });

            // Actualizar editores con el contenido
            editor.setValue(shader.contenido);
            fullscreenEditor.setValue(shader.contenido);
            
            // Asegurarse de que el canvas correcto esté activo
            canvas = isFullscreen ? 
                document.getElementById('glsl-canvas-fullscreen') : 
                document.getElementById('glsl-canvas');
            gl = canvas.getContext('webgl');
            
            inicializarWebGL();
            compile();
        })
        .catch(error => console.error('Error setting active shader:', error));
}

window.addEventListener('resize', manejarCambioOrientacion);

async function saveShader() {
    const shaderName = document.getElementById('shader-name').value;
    const userName = document.getElementById('shader-author').value;
    const shaderContent = editor.getValue();
    const isNewShader = new URLSearchParams(window.location.search).get('newShader') === 'true';

    if (!shaderName || !userName || !shaderContent) {
        alert('Por favor completa todos los campos');
        return;
    }

    try {
        // Si es un nuevo shader, verificar si ya existe uno con ese nombre
        if (isNewShader) {
            const checkResponse = await fetch(`/api/shader-exists/${shaderName}`);
            const checkResult = await checkResponse.json();
            
            if (checkResult.exists) {
                alert('Ya existe un shader con ese nombre. Por favor elige otro nombre.');
                return;
            }
        }

        const response = await fetch('/api/shaders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: shaderName,
                autor: userName,
                contenido: shaderContent
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            alert('Shader guardado exitosamente');
            // Actualizar la URL para quitar el parámetro newShader
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('newShader');
            window.history.replaceState({}, '', newUrl);
        } else {
            alert(result.error || 'Error al guardar el shader');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el shader');
    }
}

window.addEventListener('popstate', (event) => {
    if (event.state && event.state.shader) {
        // Cargar el shader anterior sin agregar nueva entrada al historial
        ['shader-dropdown', 'shader-dropdown-fullscreen'].forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                dropdown.value = event.state.shader;
                dropdown.dispatchEvent(new Event('change'));
            }
        });
    }
});

function compartirShader() {
    const url = window.location.href;
    
    if (navigator.share) {
        // API de compartir nativa (mviles principalmente)
        navigator.share({
            title: 'Shader GLSL',
            url: url
        }).catch(console.error);
    } else {
        // Fallback: copiar al portapapeles
        navigator.clipboard.writeText(url)
            .then(() => mostrarError('', 'URL copiada al portapapeles'))
            .catch(err => mostrarError('Error', 'No se pudo copiar la URL'));
    }
}

function enviarShaderUpdate(nombre, autor, contenido) {
    socket.emit('shaderUpdate', {
        id: socket.id,
        nombre: nombre,
        autor: autor,
        contenido: contenido,
        timestamp: new Date()
    });
}
socket.on("pedirShader",(data) =>{
    console.log("SE CONECTO OTRO CLIENTE QUE NO SOY YO")

    const shaderName = document.getElementById('shader-name').value;
    const shaderAuthor = document.getElementById('shader-author').value;
    const shaderContent = editor.getValue();
    
    // Actualizar el contenido del fullscreen editor
    fullscreenEditor.setValue(shaderContent);
    
    console.log("SHADER NAME MIO" + shaderName);
    
    console.log("SHADER AUTHOR MIO" + shaderAuthor);

    console.log("SHADER CONTENT MIO" + shaderContent);
    // Enviar la actualización al servidor
    enviarShaderUpdate(shaderName, shaderAuthor, shaderContent);

});
socket.on('shaderUpdate', (data) => {
    console.log('DATOS EN EL CLIENTE RECIBIDOS:', data);

    const params = new URLSearchParams(window.location.search);
    const shaderName = params.get('shader') || 'default';

    if (data.nombre === shaderName) {
        console.log("COINCIDE EL NOMBRE");
        console.log("EL SHADER ES : " + data.contenido);

        // Evitar el feedback loop
        isBroadcastingUpdate = true; // Activar el modo de broadcast
        editor.setValue(data.contenido);
        fullscreenEditor.setValue(data.contenido);
        isBroadcastingUpdate = false; // Desactivar el modo de broadcast

    } else {
        console.log("NO COINCIDE EL NOMBRE");
    }
});

// Emitir evento cuando se modifica el contenido del shader desde el teclado
editor.on("keydown", (instance, event) => {
        const shaderName = document.getElementById('shader-name').value;
        const shaderAuthor = document.getElementById('shader-author').value;
        const shaderContent = editor.getValue();
        
        // Actualizar el contenido del fullscreen editor
        fullscreenEditor.setValue(shaderContent);
        
        // Enviar la actualización al servidor
        enviarShaderUpdate(shaderName, shaderAuthor, shaderContent);
    
});

// Emitir evento cuando se modifica el contenido del fullscreen editor desde el teclado
fullscreenEditor.on("keydown", (instance, event) => {
  
        const shaderName = document.getElementById('shader-name-fullscreen').value;
        const shaderAuthor = document.getElementById('shader-author-fullscreen').value;
        const shaderContent = fullscreenEditor.getValue();
        
        // Actualizar el contenido del editor común
        editor.setValue(shaderContent);
        
        // Enviar la actualización al servidor
        enviarShaderUpdate(shaderName, shaderAuthor, shaderContent);
    
});

document.getElementById('save-button').addEventListener('click', async () => {
    const canvas = document.getElementById('yourCanvasId'); // Cambia esto por el ID de tu canvas
    const dataURL = canvas.toDataURL('image/png'); // Convierte el canvas a una URL de datos

    try {
        const response = await fetch('/api/save-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: dataURL }),
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message); // Mensaje de éxito
        } else {
            alert(data.message); // Mensaje de error
        }
    } catch (error) {
        console.error('Error al guardar la imagen:', error);
        alert('Error al guardar la imagen');
    }
});