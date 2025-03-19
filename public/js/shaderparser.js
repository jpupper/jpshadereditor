class ShaderParser {
    constructor() {
        // Lista de uniforms globales que no deben ser incluidos
        this.globalUniforms = ['time', 'mouse', 'resolution', 'fxrand', 'backbuffer'];
        this.uniforms = new Map(); // Mapa de uniforms personalizados: nombre -> valor
        this.sliderContainer = document.getElementById('uniform-sliders') || this.createSliderContainer();
        this.sliderContainerFullscreen = document.getElementById('uniform-sliders-fullscreen') || this.createSliderContainer('uniform-sliders-fullscreen');
        this.sliders = new Map(); // Mapa para mantener referencia a los sliders: nombre -> {normal: slider, fullscreen: slider}

        // Inicializar UI de fullscreen
        this.initializeFullscreenUI();
    }

    initializeFullscreenUI() {
        const codeViewBtnFullscreen = document.getElementById('code-view-btn-fullscreen');
        const uiViewBtnFullscreen = document.getElementById('ui-view-btn-fullscreen');
        const fullscreenEditor = document.getElementById('fullscreen-editor');
        const uiContainerFullscreen = document.getElementById('ui-container-fullscreen');

        if (codeViewBtnFullscreen && uiViewBtnFullscreen) {
            // Función para cambiar entre vistas en modo fullscreen
            const toggleFullscreenView = (showCode) => {
                if (showCode) {
                    fullscreenEditor.style.display = 'block';
                    uiContainerFullscreen.style.display = 'none';
                    codeViewBtnFullscreen.classList.add('active');
                    uiViewBtnFullscreen.classList.remove('active');
                } else {
                    fullscreenEditor.style.display = 'none';
                    uiContainerFullscreen.style.display = 'block';
                    codeViewBtnFullscreen.classList.remove('active');
                    uiViewBtnFullscreen.classList.add('active');
                }
                // Asegurarse que los sliders reflejen los valores actuales
                this.syncSlidersWithUniforms();
            };

            // Event listeners para los botones de cambio de vista
            codeViewBtnFullscreen.addEventListener('click', () => toggleFullscreenView(true));
            uiViewBtnFullscreen.addEventListener('click', () => toggleFullscreenView(false));
        }
    }

    createSliderContainer(id = 'uniform-sliders') {
        const container = document.createElement('div');
        container.id = id;
        document.body.appendChild(container);
        return container;
    }

    parseShader(shaderCode) {
        // Guardar los valores actuales antes de limpiar
        const currentValues = new Map(this.uniforms);
        
        // Limpiar sliders anteriores
        this.sliders.clear();
        this.sliderContainer.innerHTML = '';
        this.sliderContainerFullscreen.innerHTML = '';

        // Buscar todas las declaraciones de uniforms
        const uniformRegex = /uniform\s+float\s+(\w+)\s*;/g;
        let match;

        // Crear un nuevo Map para los uniforms encontrados
        const newUniforms = new Map();

        while ((match = uniformRegex.exec(shaderCode)) !== null) {
            const uniformName = match[1];
            
            // Ignorar uniforms globales
            if (!this.globalUniforms.includes(uniformName)) {
                // Mantener el valor anterior si existe, o usar 0.5 como valor inicial
                const value = currentValues.has(uniformName) ? currentValues.get(uniformName) : 0.5;
                newUniforms.set(uniformName, value);
                this.createSynchronizedSliders(uniformName, value);
            }
        }

        // Actualizar this.uniforms con los nuevos valores
        this.uniforms = newUniforms;
    }

    createSynchronizedSliders(uniformName, initialValue) {
        // Crear slider para modo normal
        const normalSlider = this.createSlider(uniformName, this.sliderContainer, initialValue);
        
        // Crear slider para modo fullscreen
        const fullscreenSlider = this.createSlider(uniformName, this.sliderContainerFullscreen, initialValue);
        
        // Guardar referencias a ambos sliders
        this.sliders.set(uniformName, {
            normal: normalSlider,
            fullscreen: fullscreenSlider
        });

        // Sincronizar los sliders
        normalSlider.addEventListener('input', (e) => {
            this.updateUniformValue(uniformName, parseFloat(e.target.value));
        });

        fullscreenSlider.addEventListener('input', (e) => {
            this.updateUniformValue(uniformName, parseFloat(e.target.value));
        });
    }

    updateUniformValue(uniformName, value) {
        // Actualizar el valor en this.uniforms
        this.uniforms.set(uniformName, value);
        
        // Actualizar los sliders para reflejar el nuevo valor
        this.syncSlidersWithUniforms();

        // Solo emitir el evento si no estamos recibiendo una actualización
        if (!window.isBroadcastingUpdate) {
            const params = new URLSearchParams(window.location.search);
            const shaderName = params.get('shader') || 'default';
            
            socket.emit('uniformsUpdate', {
                nombre: shaderName,
                uniforms: this.getUniformValues(),
                socketId: socket.id 
            });
        }
    }

    // Sincroniza todos los sliders con los valores en this.uniforms
    syncSlidersWithUniforms() {
        for (const [uniformName, sliderPair] of this.sliders) {
            const value = this.uniforms.get(uniformName);
            if (value !== undefined) {
                sliderPair.normal.value = value;
                sliderPair.fullscreen.value = value;
            }
        }
    }

    createSlider(uniformName, container, initialValue) {
        const sliderWrapper = document.createElement('div');
        sliderWrapper.style.marginBottom = '10px';
        
        const label = document.createElement('label');
        label.textContent = uniformName;
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.01';
        slider.value = initialValue;
        
        sliderWrapper.appendChild(label);
        sliderWrapper.appendChild(slider);
        container.appendChild(sliderWrapper);

        return slider;
    }

    // Obtener todos los valores de uniforms actuales
    getUniformValues() {
        return Object.fromEntries(this.uniforms);
    }

    // Actualizar uniforms desde datos recibidos de otro cliente
    updateUniformsFromData(uniformsData) {
        // Actualizar los valores sin emitir eventos
        for (const [uniformName, value] of Object.entries(uniformsData)) {
            if (this.uniforms.has(uniformName)) {
                this.uniforms.set(uniformName, value);
            }
        }
        // Sincronizar los sliders con los nuevos valores
        this.syncSlidersWithUniforms();
    }
}
