class ShaderAI {
    constructor() {
        this.API_URL = null;
        this.API_KEY = null;
        this.initialized = false;
        this.initializeAPI();
        this.setupEventListeners();
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
            alert('No se pudo inicializar la API de IA. Algunas funciones pueden no estar disponibles.');
        }
    }

    setupEventListeners() {
        // Esperamos a que el DOM esté completamente cargado para asegurar que los botones existen
        document.addEventListener('DOMContentLoaded', () => {
            const generateBtn = document.getElementById('generate-shader');
            const generateBtnFullscreen = document.getElementById('generate-shader-fullscreen');
            
            if (generateBtn) {
                generateBtn.addEventListener('click', () => this.handleGenerate(false));
            }
            if (generateBtnFullscreen) {
                generateBtnFullscreen.addEventListener('click', () => this.handleGenerate(true));
            }
        });
    }

    async handleGenerate(isFullscreen) {
        const promptInput = document.getElementById(isFullscreen ? 'ai-prompt-fullscreen' : 'ai-prompt');
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            alert('Por favor ingresa una descripción para el shader');
            return;
        }

        // Verificar si la API está inicializada
        if (!this.initialized || !this.API_URL) {
            alert('La API de IA no está inicializada correctamente. Por favor, verifica la configuración.');
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
            alert('Error al generar el shader. Por favor intenta de nuevo.');
            
            // Restaurar el botón en caso de error
            const generateBtn = document.getElementById(isFullscreen ? 'generate-shader-fullscreen' : 'generate-shader');
            generateBtn.textContent = 'Generar con IA';
            generateBtn.disabled = false;
        }
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
                
                // Compilar el shader usando la función global
                if (typeof compile === 'function') {
                    // Pequeño retraso para asegurar que el editor se ha actualizado completamente
                    setTimeout(() => {
                        compile();
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

    async generateShader(prompt) {
        // Verificar si la API está inicializada
        if (!this.initialized || !this.API_URL) {
            throw new Error('La API de IA no está inicializada correctamente');
        }

        try {
            console.log('Generando shader con prompt:', prompt);
            
            const messages = [
                {
                    role: "system",
                    content: `Eres un asistente especializado en generar código GLSL para shaders. 
                    Tu tarea es crear un fragment shader compatible con WebGL basado en la descripción del usuario.
                    Debes devolver SOLO el código del shader, sin explicaciones adicionales.
                    El código debe estar completo y listo para ser usado, incluyendo todas las variables y funciones necesarias.
                    Asegúrate de que el shader sea visualmente interesante y eficiente.
                    El shader debe comenzar con la línea "#version 300 es" y definir "precision highp float;".
                    Debe incluir una función main() que asigne un color a fragColor.
                    Utiliza las variables uniformes: time (float), resolution (vec2), y mouse (vec2).
                    NO incluyas comentarios explicativos extensos, solo el código necesario.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ];

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
}

// Initialize the ShaderAI when the document is loaded
window.shaderAI = new ShaderAI();
