import { parameters, surface, isFullscreen, mostrarError } from './script.js';

let buffer, vertexPosition;
let frontTarget, backTarget;
let currentProgram = null;

export function inicializarWebGL(gl) {
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0]), gl.STATIC_DRAW);

    surface.buffer = gl.createBuffer();

    createRenderTargets(gl);
}

export function compile(gl, editorInstance) {
    console.log("Compilando shader");
    let program = gl.createProgram();
    let fragment = editorInstance.getValue();
    let vertex = document.getElementById('surfaceVertexShader').textContent;

    let vs = createShader(gl, vertex, gl.VERTEX_SHADER);
    let fs = createShader(gl, fragment, gl.FRAGMENT_SHADER);

    if (vs == null || fs == null) {
        console.error("Error al crear shaders");
        return null;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        let error = gl.getProgramInfoLog(program);
        mostrarError('ERROR linking program!', error);
        console.error("Error detallado al enlazar el programa:", error);
        return;
    }

    if (currentProgram) {
        gl.deleteProgram(currentProgram);
    }

    currentProgram = program;

    cacheUniformLocation(gl, program, 'time');
    cacheUniformLocation(gl, program, 'mouse');
    cacheUniformLocation(gl, program, 'resolution');
    cacheUniformLocation(gl, program, 'backbuffer');
    cacheUniformLocation(gl, program, 'fxrand');

    vertexPosition = gl.getAttribLocation(currentProgram, "position");
    gl.enableVertexAttribArray(vertexPosition);

    console.log("Shader compilado exitosamente");
    mostrarError('', '');
}

function cacheUniformLocation(gl, program, label) {
    if (!program.uniformsCache) {
        program.uniformsCache = {};
    }
    program.uniformsCache[label] = gl.getUniformLocation(program, label);
}

function createShader(gl, src, type) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        mostrarError((type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT') + ' SHADER ERROR:', gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function createTarget(gl, width, height) {
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

export function createRenderTargets(gl) {
    frontTarget = createTarget(gl, parameters.screenWidth, parameters.screenHeight);
    backTarget = createTarget(gl, parameters.screenWidth, parameters.screenHeight);
}

export function animate(gl) {
    requestAnimationFrame(() => animate(gl));
    render(gl);
}

function render(gl) {
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

export function ajustarTamanoCanvas(gl, canvasElement) {
   /* const container = document.getElementById('canvas-container');
    const rect = container.getBoundingClientRect();
    const displayWidth = Math.floor(rect.width);
    const displayHeight = Math.floor(rect.height);

    canvasElement.width = displayWidth;
    canvasElement.height = displayHeight;

    // Ajustar el estilo del canvas para mantener las dimensiones visuales
    canvasElement.style.width = `${displayWidth}px`;
    canvasElement.style.height = `${displayHeight}px`;

    gl.viewport(0, 0, canvasElement.width, canvasElement.height);

    parameters.screenWidth = canvasElement.width;
    parameters.screenHeight = canvasElement.height;

    createRenderTargets(gl);*/
}