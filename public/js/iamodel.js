class ShaderAI {
    constructor() {
        this.API_URL = null;
        this.API_KEY = null;
        this.initialized = false;
        this.available = false; // Por defecto la IA no está disponible hasta que se verifique el login
        this.initializeAPI();
        this.setupEventListeners();
        this.checkLoginStatus(); // Verificar estado de login inicial
    }

    async initializeAPI() {
        try {
            // Obtener la configuración de la API desde el servidor
            const response = await fetch(`${window.config.API_URL}/api/config`);
            if (!response.ok) {
                throw new Error('No se pudo obtener la configuración de la API');
            }
            
            const config = await response.json();
            this.API_URL = config.openai.apiUrl;
            // No almacenamos la clave API directamente en el código del cliente
            // La clave se manejará solo en el servidor
            this.initialized = true;
            console.log('API de IA inicializada correctamente');
        } catch (error) {
            console.error('Error al inicializar la API de IA:', error);
            this.showError('No se pudo inicializar la API de IA. Algunas funciones pueden no estar disponibles.');
        }
    }

    setActive(_value) {
        this.available = _value;
        
        // Actualizar la interfaz según la disponibilidad
        const aiGeneratorElements = document.querySelectorAll('.ai-shader-generator');
        
        aiGeneratorElements.forEach(element => {
            if (!this.available) {
                // Si la IA no está disponible, modificar el contenido
                element.innerHTML = '<h3>Generación por IA no disponible</h3>';
                element.classList.add('ai-unavailable');
            } else {
                // Si la IA está disponible, mostrar la interfaz completa
                element.classList.remove('ai-unavailable');
                
                // Determinar si este es el elemento de pantalla completa o normal
                const isFullscreen = element.closest('#ui-container-fullscreen') !== null;
                const username = localStorage.getItem('username');
                
                // Restaurar el HTML original según el tipo de elemento
                element.innerHTML = `
                    <h3>Generador de Shaders con IA</h3>
                    <textarea id="ai-prompt${isFullscreen ? '-fullscreen' : ''}" placeholder="Describe el shader que quieres generar..." class="shader-input ai-textarea"></textarea>
                    <button id="generate-shader${isFullscreen ? '-fullscreen' : ''}" class="shader-button">Generar con IA</button>
                `;
                
                // Volver a añadir los event listeners para los botones recién creados
                const generateBtn = element.querySelector(`#generate-shader${isFullscreen ? '-fullscreen' : ''}`);
                if (generateBtn) {
                    generateBtn.addEventListener('click', () => this.handleGenerate(isFullscreen));
                }
            }
        });
        
        console.log(`Estado de disponibilidad de IA: ${this.available ? 'Disponible' : 'No disponible'}`);
    }

    setupEventListeners() {
        // Esperamos a que el DOM esté completamente cargado para asegurar que los botones existen
        document.addEventListener('DOMContentLoaded', () => {
            // Escuchar cambios en el estado de login
            window.addEventListener('storage', (e) => {
                if (e.key === 'username') {
                    this.checkLoginStatus();
                }
            });
            
            // Verificar estado inicial
            this.checkLoginStatus();
        });
    }

    async handleGenerate(isFullscreen) {
        // Verificar si la IA está disponible
        if (!this.available) {
            this.showError('La generación por IA no está disponible en este momento.', isFullscreen);
            return;
        }
        
        const promptInput = document.getElementById(isFullscreen ? 'ai-prompt-fullscreen' : 'ai-prompt');
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            this.showError('Por favor ingresa una descripción para el shader', isFullscreen);
            return;
        }

        // Verificar si la API está inicializada
        if (!this.initialized || !this.API_URL) {
            this.showError('La API de IA no está inicializada correctamente. Por favor, verifica la configuración.', isFullscreen);
            return;
        }

        console.log('Prompt del usuario:', prompt);

        try {
            // Mostrar indicador de carga
            const generateBtn = document.getElementById(isFullscreen ? 'generate-shader-fullscreen' : 'generate-shader');
            const originalText = generateBtn.textContent;
            generateBtn.textContent = 'Generando...';
            generateBtn.disabled = true;

            const generatedShader = await this.generateShader(prompt);
            
            // Restaurar el botón
            generateBtn.textContent = originalText;
            generateBtn.disabled = false;
            
            // Actualizar el contenido del editor
            this.updateEditorContent(generatedShader, isFullscreen);

        } catch (error) {
            console.error('Error generating shader:', error);
            this.showError('Error al generar el shader. Por favor intenta de nuevo.', isFullscreen);
            
            // Restaurar el botón en caso de error
            const generateBtn = document.getElementById(isFullscreen ? 'generate-shader-fullscreen' : 'generate-shader');
            generateBtn.textContent = 'Generar con IA';
            generateBtn.disabled = false;
        }
    }

    async generateShader(prompt) {
        // Verificar si la API está inicializada
        if (!this.initialized || !this.API_URL) {
            throw new Error('La API de IA no está inicializada correctamente');
        }

        try {
            console.log('Generando shader con el prompt:', prompt);
            
            // Cargar el contexto desde el archivo
            const contextResponse = await fetch('js/context.txt');
            if (!contextResponse.ok) {
                throw new Error('No se pudo cargar el archivo de contexto');
            }
            const systemContent = await contextResponse.text();
            
            // Obtener el contenido actual del editor
            const isFullscreen = document.getElementById('fullscreen-container').style.display !== 'none';
            const currentShaderCode = isFullscreen ? fullscreenEditor.getValue() : editor.getValue();
            
            console.log('Contexto cargado desde context.txt:', systemContent);
            console.log('Shader actual del editor:', currentShaderCode);
            
            const messages = [
                {
                    role: "system",
                    content: systemContent
                },
                {
                    role: "user",
                    content: `Here is the current shader code:\n\n\`\`\`glsl\n${currentShaderCode}\n\`\`\`\n\nModify this shader according to the following instruction: ${prompt}`
                }
            ];
            
            console.log('Mensajes enviados al modelo:', JSON.stringify(messages, null, 2));

            const data = await this.makeOpenAIRequest(messages);
            const shaderCode = data.choices[0].message.content;
            console.log('Respuesta de ChatGPT:', shaderCode);
            
            return this.extractShaderCode(shaderCode);
        } catch (error) {
            console.error('Error al generar el shader:', error);
            throw error;
        }
    }

    async makeOpenAIRequest(messages) {
        try {
            // Usamos el endpoint proxy del servidor en lugar de la API directa
            const response = await fetch(`${window.config.API_URL}/api/openai-proxy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error en la API: ${errorData.error?.message || 'Error desconocido'}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al hacer la solicitud a la API:', error);
            throw error;
        }
    }

    extractShaderCode(text) {
        // Buscar código GLSL dentro de bloques de código markdown
        const codeBlockMatch = text.match(/```(?:glsl)?\s*(precision[\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            console.log('Shader extraído de bloque de código:', codeBlockMatch[1]);
            return codeBlockMatch[1];
        }
        
        // Si no hay bloque de código, extraer todo el código GLSL
        // Buscamos desde "precision" hasta el final del código, capturando todos los bloques
        const fullShaderMatch = text.match(/precision[\s\S]*?void\s+main\s*\(\s*\)[\s\S]*?(?:discard|gl_FragColor)[\s\S]*?;(?:[^;]*?})+/);
        if (fullShaderMatch) {
            console.log('Shader extraído completo:', fullShaderMatch[0]);
            return fullShaderMatch[0];
        }
        
        // Si todo falla, devolver el texto original
        console.log('No se pudo extraer el shader, devolviendo texto original');
        return text;
    }

    updateEditorContent(shaderCode, isFullscreen) {
        try {
            // Acceder directamente a las variables globales del editor
            const editorInstance = isFullscreen ? fullscreenEditor : editor;
            
            if (editorInstance) {
                // Guardar la posición del cursor actual
                const cursorPos = editorInstance.getCursor();
                
                // Actualizar el contenido del editor
                editorInstance.setValue(shaderCode);
                
                // Forzar al editor a refrescarse
                editorInstance.refresh();
                
                // Restaurar la posición del cursor
                editorInstance.setCursor(cursorPos);
                
                // Forzar el foco en el editor para asegurar que se muestre
                editorInstance.focus();
                
                // Marcar que este cambio viene de la IA para que el sistema lo maneje adecuadamente
                window.shaderFromAI = true;
                
                // Compilar el shader usando la función global
                if (typeof compile === 'function') {
                    // Pequeño retraso para asegurar que el editor se ha actualizado completamente
                    setTimeout(() => {
                        compile();
                        // Reiniciar la bandera después de la compilación
                        setTimeout(() => {
                            window.shaderFromAI = false;
                        }, 100);
                    }, 100);
                }
                
                // Enviar actualización a otros clientes si está disponible
                if (typeof enviarShaderUpdate === 'function') {
                    const nombre = document.getElementById(isFullscreen ? 'shader-name-fullscreen' : 'shader-name').value;
                    const autor = document.getElementById(isFullscreen ? 'shader-author-fullscreen' : 'shader-author').value;
                    enviarShaderUpdate(nombre, autor, shaderCode, cursorPos);
                }
            } else {
                console.error('No se pudo encontrar la instancia del editor');
            }
        } catch (error) {
            console.error('Error al actualizar el editor:', error);
        }
    }

    /**
     * Verifica el estado de login y actualiza la disponibilidad de la IA
     */
    checkLoginStatus() {
        const username = localStorage.getItem('username');
        this.setActive(!!username); // Activar la IA solo si hay un usuario logueado
    }

    /**
     * Muestra un mensaje de error en el contenedor apropiado
     * @param {string} message - Mensaje de error a mostrar
     * @param {boolean} isFullscreen - Si estamos en modo pantalla completa o no
     */
    showError(message, isFullscreen = false) {
        // Determinar el contenedor de error adecuado
        const errorContainer = document.getElementById(isFullscreen ? 'fullscreen-error-display' : 'error-display');
        
        if (errorContainer) {
            // Crear un elemento para el mensaje de error
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            
            // Limpiar errores anteriores
            errorContainer.innerHTML = '';
            
            // Añadir el nuevo mensaje de error
            errorContainer.appendChild(errorElement);
            
            // Hacer visible el contenedor de error
            errorContainer.style.display = 'block';
            
            // Configurar un temporizador para ocultar el mensaje después de 5 segundos
            setTimeout(() => {
                errorElement.classList.add('fade-out');
                setTimeout(() => {
                    errorContainer.removeChild(errorElement);
                    if (errorContainer.children.length === 0) {
                        errorContainer.style.display = 'none';
                    }
                }, 500); // Tiempo para la animación de desvanecimiento
            }, 5000);
        } else {
            // Si no hay contenedor de error, usar console.error como respaldo
            console.error('Error:', message);
        }
    }
}

// Initialize the ShaderAI when the document is loaded
window.shaderAI = new ShaderAI();
