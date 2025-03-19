/*Estamos haciendo una aplicación para manejar shaders en tiempo real. 

La aplicación funciona con un sistema de usuarios donde te permite crear shaders cada shader es una sesion eso esta dado por el address. 

Cada sesion actualiza en tiempo real el codigo de todas las sesiones que estan conectadas. 

Ademas de eso se puede guardar el shader en el base de datos manejada por mongo db. 

Cuando se guarda el shader también deberia guardarse una imagen. El modulo de la imagen no esta funcionando correctamente y la imagen no se esta guardando. */


let canvas, gl, buffer, currentProgram, vertexPosition, screenVertexPosition;
let parameters = { startTime: Date.now(), time: 0, mouseX: 0.5, mouseY: 0.5, screenWidth: 0, screenHeight: 0, fxrand: Math.random() };
let surface = { centerX: 0, centerY: 0, width: 1, height: 1, lastX: 0, lastY: 0 };
let frontTarget, backTarget, screenProgram;
let editor, fullscreenEditor, errorDisplay, fullscreenErrorDisplay;
let isFullscreen = false;
let lastValidProgram = null;
const socket = window.socketInstance; // Usar la instancia de socket existente
let isBroadcastingUpdate = true;
let isUserChange = true; // Nueva bandera para controlar si el cambio es del usuario
let shaderParser = new ShaderParser(); // Instancia del parser de shaders
let isSuperFullscreen = false;

init();
animate();

function init() {
    
    isBroadcastingUpdate = true;
    inicializarElementosDOM();
    inicializarContextosWebGL();
    inicializarEditores();
    inicializarVistasUI();
    
    // Inicializar conexión Socket.IO
    socket.on('connect', () => {
        console.log('Conectado al servidor:', socket.id);
        // Pedir el shader actual a los demás clientes
        socket.emit("pedirShader");
    });

    socket.on('disconnect', () => {
        console.log('Desconectado del servidor');
    });
    
    if (!gl) {
        console.error("WebGL no está soportado, pero se mostrará el código.");
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

    // Permitimos updates después de 2 segundos para asegurar que todo esté inicializado
    
    //Esto lo pongo así para que se habilite despues de un toque.
    setTimeout(() => {
        console.log("Habilitando updates después de inicialización...");
        socket.emit("pedirShader");
        isBroadcastingUpdate = false;
    }, 2000);
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

    // Manejar cambios en los editores
    editor.on("change", (cm, change) => {
        if (!isBroadcastingUpdate) {
            compile();
            // Solo enviar actualización si no estamos en broadcast
            const nombre = document.getElementById('shader-name').value;
            const autor = document.getElementById('shader-author').value;
            enviarShaderUpdate(nombre, autor, cm.getValue(), cm.getCursor());
        }
    });

    fullscreenEditor.on("change", (cm, change) => {
        if (!isBroadcastingUpdate) {
            compile();
            // Solo enviar actualización si no estamos en broadcast
            const nombre = document.getElementById('shader-name-fullscreen').value;
            const autor = document.getElementById('shader-author-fullscreen').value;
            enviarShaderUpdate(nombre, autor, cm.getValue(), cm.getCursor());
        }
    });
}

function inicializarVistasUI() {
    const codeViewBtn = document.getElementById('code-view-btn');
    const uiViewBtn = document.getElementById('ui-view-btn');
    const editorContainer = document.getElementById('editor-container');
    const uiContainer = document.getElementById('ui-container');

    function setActiveView(isCode) {
        // Actualizar estado de los botones
        codeViewBtn.classList.toggle('active', isCode);
        uiViewBtn.classList.toggle('active', !isCode);
        
        // Mostrar/ocultar contenedores
        editorContainer.style.display = isCode ? 'block' : 'none';
        uiContainer.style.display = isCode ? 'none' : 'block';

        // Actualizar el contenido del editor cuando volvemos a la vista de código
        if (isCode) {
            const currentShader = document.getElementById('shader-dropdown').value;
            
            // Forzar un refresco completo del editor para evitar problemas de visualización
            setTimeout(() => {
                editor.refresh();
                
                // Si hay un shader seleccionado, compilarlo
                if (currentShader) {
                    compile();
                }
            }, 50);
        }
    }

    codeViewBtn.addEventListener('click', () => setActiveView(true));
    uiViewBtn.addEventListener('click', () => setActiveView(false));
    
    // Configurar también para la vista en pantalla completa
    const codeViewBtnFullscreen = document.getElementById('code-view-btn-fullscreen');
    const uiViewBtnFullscreen = document.getElementById('ui-view-btn-fullscreen');
    const fullscreenEditorContainer = document.getElementById('fullscreen-editor');
    const uiContainerFullscreen = document.getElementById('ui-container-fullscreen');
    
    function setActiveViewFullscreen(isCode) {
        // Actualizar estado de los botones
        codeViewBtnFullscreen.classList.toggle('active', isCode);
        uiViewBtnFullscreen.classList.toggle('active', !isCode);
        
        // Mostrar/ocultar contenedores
        fullscreenEditorContainer.style.display = isCode ? 'block' : 'none';
        uiContainerFullscreen.style.display = isCode ? 'none' : 'block';
        
        // Actualizar el contenido del editor cuando volvemos a la vista de código
        if (isCode) {
            const currentShader = document.getElementById('shader-dropdown-fullscreen').value;
            
            // Forzar un refresco completo del editor para evitar problemas de visualización
            setTimeout(() => {
                fullscreenEditor.refresh();
                
                // Si hay un shader seleccionado, compilarlo
                if (currentShader) {
                    compile();
                }
            }, 50);
        }
    }
    
    if (codeViewBtnFullscreen) {
        codeViewBtnFullscreen.addEventListener('click', () => setActiveViewFullscreen(true));
    }
    if (uiViewBtnFullscreen) {
        uiViewBtnFullscreen.addEventListener('click', () => setActiveViewFullscreen(false));
    }
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

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            if (isSuperFullscreen) {
                toggleSuperFullscreen();
            } else if (isFullscreen) {
                salirPantallaCompleta();
            }
        }
    });

    document.getElementById('fullscreen-button').addEventListener('click', entrarPantallaCompleta);
    document.getElementById('super-fullscreen-button').addEventListener('click', toggleSuperFullscreen);
    document.getElementById('exit-fullscreen').addEventListener('click', salirPantallaCompleta);
    document.getElementById('toggle-editor').addEventListener('click', toggleEditor);
    document.getElementById('open-editor').addEventListener('click', toggleEditor);
}

async function cargarShaderDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const shaderName = params.get('shader') || 'default';
    const isNewShader = params.get('newShader') === 'true';
    
    try {
        // Asegurarnos que no se disparen updates durante la carga
        const prevBroadcastState = isBroadcastingUpdate;
        isBroadcastingUpdate = true;

        let shader;
        
        if (isNewShader) {
            // Para un nuevo shader, usar el contenido del shader default
            const defaultResponse = await fetch(`${CONFIG.API_URL}/api/shaders/default`);
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
            const response = await fetch(`${CONFIG.API_URL}/api/shaders/${shaderName}`);
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

        // Restaurar el estado anterior de broadcasting
        isBroadcastingUpdate = prevBroadcastState;
        
        // Actualizar visibilidad del botón de guardar
        actualizarVisibilidadBotonGuardar(shader.autor);
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
    const source = editor.getValue();
    
    // Parsear los uniforms del shader
    shaderParser.parseShader(source);

    let program = gl.createProgram();
    let fragment = isFullscreen ? fullscreenEditor.getValue() : editor.getValue();
    let vertex = document.getElementById('surfaceVertexShader').textContent;

    const vs = createShader(vertex, gl.VERTEX_SHADER);
    const fs = createShader(fragment, gl.FRAGMENT_SHADER);

    if (vs === null || fs === null) return null;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        mostrarError('Error al enlazar el programa', gl.getProgramInfoLog(program));
        return null;
    }

    // Cachear ubicaciones de uniforms globales
    program.uniformsCache = {};
    program.uniformsCache['time'] = gl.getUniformLocation(program, 'time');
    program.uniformsCache['mouse'] = gl.getUniformLocation(program, 'mouse');
    program.uniformsCache['resolution'] = gl.getUniformLocation(program, 'resolution');
    program.uniformsCache['fxrand'] = gl.getUniformLocation(program, 'fxrand');
    program.uniformsCache['backbuffer'] = gl.getUniformLocation(program, 'backbuffer');

    // Cachear ubicaciones de uniforms personalizados
    const customUniforms = shaderParser.getUniformValues();
    for (const name of Object.keys(customUniforms)) {
        program.uniformsCache[name] = gl.getUniformLocation(program, name);
    }

    if (currentProgram) {
        gl.deleteProgram(currentProgram);
    }

    currentProgram = program;
    lastValidProgram = program;

    vertexPosition = gl.getAttribLocation(currentProgram, "position");
    gl.enableVertexAttribArray(vertexPosition);

    // Limpiar el mensaje de error si la compilación fue exitosa
    mostrarError('', '');

    // Emitir evento de edición con todos los datos necesarios
    //isBroadcastingUpdate = true;
    if(!isBroadcastingUpdate){
        socket.emit('shaderUpdate', {
            id: socket.id,
            nombre: document.getElementById('shader-name').value, // Obtener el nombre del shader
            autor: document.getElementById('shader-author').value, // Obtener el autor del shader
            contenido: fragment, // Incluir el contenido del shader
            timestamp: new Date() // Mantener el timestamp
        });
    }
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

    // Establecer uniforms globales
    gl.uniform1f(currentProgram.uniformsCache['time'], parameters.time / 1000);
    gl.uniform2f(currentProgram.uniformsCache['mouse'], parameters.mouseX, parameters.mouseY);
    gl.uniform2f(currentProgram.uniformsCache['resolution'], parameters.screenWidth, parameters.screenHeight);
    gl.uniform1f(currentProgram.uniformsCache['fxrand'], parameters.fxrand);

    // Establecer uniforms personalizados
    const customUniforms = shaderParser.getUniformValues();
    for (const [name, value] of Object.entries(customUniforms)) {
        const location = currentProgram.uniformsCache[name];
        if (location !== undefined) {
            gl.uniform1f(location, value);
        }
    }

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
    console.log('Iniciando fetchShaders...'); // Debug log
    
    fetch(`${CONFIG.API_URL}/api/shaders`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(shaders => {
            console.log('Shaders obtenidos:', shaders); // Debug log
            
            // Limpiar dropdowns
            ['shader-dropdown', 'shader-dropdown-fullscreen'].forEach(dropdownId => {
                const dropdown = document.getElementById(dropdownId);
                dropdown.innerHTML = '<option value="">Selecciona un shader</option>';
                
                // Agregar shaders al dropdown
                shaders.forEach(shader => {
                    const option = document.createElement('option');
                    option.value = shader.nombre;
                    option.textContent = shader.nombre;
                    dropdown.appendChild(option);
                });
            });
        })
        .catch(error => {
            console.error('Error al obtener shaders:', error);
            mostrarError('Error', 'No se pudieron cargar los shaders');
        });
}

function setActiveShader(event) {
    const shaderName = event.target.value;
    if (!shaderName) return;

    fetch(`${CONFIG.API_URL}/api/shaders/${shaderName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            actualizarCamposShader(data);
            actualizarURL(shaderName);
        })
        .catch(error => {
            console.error('Error al cargar shader:', error);
            mostrarError('Error', 'No se pudo cargar el shader');
        });
}

function actualizarCamposShader(shader) {
    if (shader) {
        document.getElementById('shader-name').value = shader.nombre || '';
        document.getElementById('shader-author').value = shader.autor || '';
        document.getElementById('shader-name-fullscreen').value = shader.nombre || '';
        document.getElementById('shader-author-fullscreen').value = shader.autor || '';
        
        // Actualizar visibilidad del botón de guardar
        actualizarVisibilidadBotonGuardar(shader.autor);
        
        // Actualizar contenido del editor
        editor.setValue(shader.contenido);
        fullscreenEditor.setValue(shader.contenido);
        compile();
    }
}

async function saveShader() {
    const nombre = document.getElementById('shader-name').value;
    const autor = document.getElementById('shader-author').value;
    const contenido = editor.getValue();
    const canvas = document.getElementById('glsl-canvas');

    if (!nombre || !autor || !contenido) {
        mostrarError('Error', 'Por favor completa todos los campos');
        return;
    }

    try {
        // Guardar el shader
        const response = await fetch(`${CONFIG.API_URL}/api/shaders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nombre: nombre,
                autor: autor,
                contenido: contenido
            })
        });

        if (!response.ok) {
            throw new Error('Error al guardar el shader');
        }

        const data = await response.json();
        console.log('Shader guardado:', data);

        // Guardar el tamaño original del canvas
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;
        const originalStyle = canvas.style.cssText;

        // Establecer un tamaño cuadrado fijo para la miniatura
        const thumbnailSize = 256; // Tamaño fijo para la miniatura
        canvas.width = thumbnailSize;
        canvas.height = thumbnailSize;
        canvas.style.width = `${thumbnailSize}px`;
        canvas.style.height = `${thumbnailSize}px`;
        gl.viewport(0, 0, thumbnailSize, thumbnailSize);

        // Forzar un render con el nuevo tamaño
        render();

        // Intentar guardar la imagen
        try {
            const imageData = canvas.toDataURL('image/png');
            
            // Enviar la imagen directamente como base64
            const imageResponse = await fetch(`${CONFIG.API_URL}/api/save-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData,
                    name: nombre
                })
            });

            if (!imageResponse.ok) {
                const errorData = await imageResponse.json();
                throw new Error(errorData.error || 'Error al guardar la imagen');
            }

            const imageResult = await imageResponse.json();
            console.log('Imagen guardada en:', imageResult.path);
        } catch (error) {
            console.error('Error al guardar la imagen:', error);
            mostrarError('Advertencia', 'El shader se guardó pero hubo un problema al guardar la imagen de previsualización');
        }

        // Restaurar el tamaño original del canvas
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        canvas.style.cssText = originalStyle;
        gl.viewport(0, 0, originalWidth, originalHeight);
        render();

        mostrarError('Éxito', 'Shader guardado correctamente');
        actualizarURL(nombre);
        fetchShaders();  // Actualizar la lista de shaders
    } catch (error) {
        console.error('Error al guardar:', error);
        mostrarError('Error', 'No se pudo guardar el shader');
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

function enviarShaderUpdate(nombre, autor, contenido, cursorPos) {
    console.log("ENVIA SOCKET SHADER UPDATE");
    if(!isBroadcastingUpdate){
        //window.emitShaderUpdate(nombre, autor, contenido, cursorPos);
    }
}

socket.on("pedirShader",(data) =>{
    console.log("SE CONECTO OTRO CLIENTE QUE NO SOY YO")

    const shaderName = document.getElementById('shader-name').value;
    const autor = document.getElementById('shader-author').value;
    const contenido = editor.getValue();
    const cursorPos = editor.getCursor();

    // Enviar el shader actual al nuevo cliente
    enviarShaderUpdate(shaderName, autor, contenido, cursorPos);
});

socket.on("enviarShaderActual", (data) => {
    console.log("Servidor solicita enviar shader actual al cliente:", data.requestingClient);
    
    const shaderName = document.getElementById('shader-name').value;
    const shaderAuthor = document.getElementById('shader-author').value;
    const _contenido = editor.getValue();
    const cursorPos = editor.getCursor();
    /*if(!isBroadcastingUpdate){
        window.emitShaderUpdate(nombre, autor, contenido, cursorPos);
    }*/

    //if(!isBroadcastingUpdate){
    console.log("REENVIA EL SHADER ACTUAL");
    socket.emit('shaderUpdate', {
        id: socket.id,
        nombre: document.getElementById('shader-name').value, // Obtener el nombre del shader
        autor: document.getElementById('shader-author').value, // Obtener el autor del shader
        contenido: _contenido, // Incluir el contenido del shader
        timestamp: new Date() // Mantener el timestamp
    });
    //}
    // Enviar el shader actual
    //enviarShaderUpdate(shaderName, shaderAuthor, contenido, cursorPos);
});

socket.on('shaderUpdate', (data) => {
    console.log('DATOS EN EL CLIENTE RECIBIDOS:', data);

    // Si el update viene del mismo cliente, ignorarlo
    if (data.id === socket.id) {
        console.log("Ignorando update del mismo cliente");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const shaderName = params.get('shader') || 'default';

    if (data.nombre === shaderName) {
        console.log("COINCIDE EL NOMBRE");
        console.log("EL SHADER ES : " + data.contenido);

        isBroadcastingUpdate = true;
        // Guardar posición actual del cursor
        const currentCursor = editor.getCursor();
        const currentFullscreenCursor = fullscreenEditor.getCursor();
        
        // Actualizar contenido
        editor.setValue(data.contenido);
        fullscreenEditor.setValue(data.contenido);
        
        // Restaurar posición del cursor
        editor.setCursor(currentCursor);
        fullscreenEditor.setCursor(currentFullscreenCursor);
        compile();
        
        isBroadcastingUpdate = false;
    } else {
        console.log("NO COINCIDE EL NOMBRE");
    }
});

// Escuchar actualizaciones de uniforms
socket.on('uniformsUpdate', (data) => {
    // Si el update viene del mismo cliente, ignorarlo
    if (data.id === socket.id) {
        console.log("Ignorando uniform update del mismo cliente");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const currentShader = params.get('shader') || 'default';

    if (data.nombre === currentShader) {
        console.log("Actualizando uniforms desde otro cliente");
        window.isBroadcastingUpdate = true;
        shaderParser.updateUniformsFromData(data.uniforms);
        window.isBroadcastingUpdate = false;
    }
});

// Emitir evento cuando se modifica el contenido del shader desde el teclado
editor.on("keydown", (instance, event) => {
    const shaderName = document.getElementById('shader-name').value;
    const shaderAuthor = document.getElementById('shader-author').value;
    const shaderContent = editor.getValue();
    const cursorPos = editor.getCursor();
    
    // Actualizar el contenido del fullscreen editor
    fullscreenEditor.setValue(shaderContent);
    fullscreenEditor.setCursor(cursorPos);
    compile();
    // Enviar la actualización al servidor
    //enviarShaderUpdate(shaderName, shaderAuthor, shaderContent, cursorPos);
});

// Emitir evento cuando se modifica el contenido del fullscreen editor desde el teclado
fullscreenEditor.on("keydown", (instance, event) => {
    const shaderName = document.getElementById('shader-name-fullscreen').value;
    const shaderAuthor = document.getElementById('shader-author-fullscreen').value;
    const shaderContent = fullscreenEditor.getValue();
    const cursorPos = fullscreenEditor.getCursor();
    
    // Actualizar el contenido del editor común
    editor.setValue(shaderContent);
    editor.setCursor(cursorPos);
    compile();
    // Enviar la actualización al servidor
    //enviarShaderUpdate(shaderName, shaderAuthor, shaderContent, cursorPos);
});

// Nueva función para actualizar la visibilidad del botón de guardar
function actualizarVisibilidadBotonGuardar(shaderAutor) {
    const currentUser = document.querySelector('.username-display')?.textContent;
    const saveButtons = [
        document.getElementById('save-shader'),
        document.getElementById('save-shader-fullscreen')
    ];
    
    saveButtons.forEach(button => {
        if (button) {
            button.style.display = (currentUser && currentUser === shaderAutor) ? 'block' : 'none';
        }
    });
}

// Función para detectar el modo de visualización
function detectViewMode() {
    
    if (esMobile()) {
        document.body.setAttribute('data-mode', 'mobile');
        console.log('Modo: mobile');
        handleMobileMode();
        return 'mobile';
    } else if (document.fullscreenElement) {
        document.body.setAttribute('data-mode', 'fullscreen');
        console.log('Modo: fullscreen');
        return 'fullscreen';
    } else {
        document.body.setAttribute('data-mode', 'common');
        console.log('Modo: común');
        return 'common';
    }
}

// Función para manejar el modo mobile
function handleMobileMode() {
    const fullscreenButton = document.getElementById('fullscreen-button');
    const editorSection = document.getElementById('editor-section');
    const openEditorBtn = document.getElementById('open-editor');
    const closeEditorBtn = document.getElementById('toggle-editor');
    
    entrarPantallaCompleta();

    // Ocultar botón de fullscreen
    if (fullscreenButton) {
        fullscreenButton.style.display = 'none';
    }

    // Configurar estado inicial
    if (editorSection) {
        editorSection.style.display = 'none';
        openEditorBtn.style.display = 'block';
        closeEditorBtn.style.display = 'none';
    }

    // Manejar apertura del editor
    if (openEditorBtn) {
        openEditorBtn.addEventListener('click', () => {
            editorSection.style.display = 'block';
            openEditorBtn.style.display = 'none';
            closeEditorBtn.style.display = 'block';
            console.log('Editor abierto en modo mobile');
        });
    }

    // Manejar cierre del editor
    if (closeEditorBtn) {
        closeEditorBtn.addEventListener('click', () => {
            editorSection.style.display = 'none';
            closeEditorBtn.style.display = 'none';
            openEditorBtn.style.display = 'block';
            console.log('Editor cerrado en modo mobile');
        });
    }
}

// Agregar event listeners para detectar cambios
window.addEventListener('resize', detectViewMode);
window.addEventListener('load', detectViewMode);
document.addEventListener('fullscreenchange', detectViewMode);

function toggleSuperFullscreen() {
    isSuperFullscreen = !isSuperFullscreen;
    document.body.setAttribute('data-mode', isSuperFullscreen ? 'super-fullscreen' : '');
    
    if (isSuperFullscreen) {
        parameters.screenWidth = window.innerWidth;
        parameters.screenHeight = window.innerHeight;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        onWindowResize(); // Restaurar tamaño normal
    }
    
    if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
}