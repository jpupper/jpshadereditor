document.addEventListener('DOMContentLoaded', function() {
    // Script para manejar el inicio de sesión y registro
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const overlay = document.getElementById('overlay');

    // Solo agregar event listeners si los elementos existen (estamos en index.html)
    if (loginButton && registerButton && overlay) {
        loginButton.addEventListener('click', function() {
            overlay.style.display = 'block';
            document.getElementById('login-modal').style.display = 'block';
        });

        registerButton.addEventListener('click', function() {
            overlay.style.display = 'block';
            document.getElementById('register-modal').style.display = 'block';
        });

        overlay.addEventListener('click', function() {
            this.style.display = 'none';
            document.getElementById('login-modal').style.display = 'none';
            document.getElementById('register-modal').style.display = 'none';
        });

        // Manejar el envío del formulario de inicio de sesión
        document.getElementById('login-form').addEventListener('submit', function(event) {
            event.preventDefault();
            const username = this[0].value;
            const password = this[1].value;

            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            })
            .then(response => {
                if (response.ok) {
                    localStorage.setItem('username', username);
                    window.location.href = 'user.html';
                } else {
                    return response.json().then(errorData => {
                        alert(errorData.error);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al iniciar sesión. Inténtalo de nuevo.');
            });
        });

        document.getElementById('signup-button').addEventListener('click', function() {
            document.getElementById('login-modal').style.display = 'none';
            document.getElementById('register-modal').style.display = 'block';
        });

        document.getElementById('register-form').addEventListener('submit', function(event) {
            event.preventDefault();
            const username = this[0].value;
            const email = this[1].value;
            const password = this[2].value;

            fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            })
            .then(response => {
                if (response.ok) {
                    localStorage.setItem('username', username);
                    window.location.href = 'user.html';
                } else {
                    return response.json().then(errorData => {
                        alert(errorData.error);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al registrarse. Inténtalo de nuevo.');
            });
        });

        document.getElementById('back-to-login-button').addEventListener('click', function() {
            document.getElementById('register-modal').style.display = 'none';
            document.getElementById('login-modal').style.display = 'block';
        });
    }

    // Verificar si estamos en la página de usuario
    if (window.location.pathname.includes('user.html')) {
        const username = localStorage.getItem('username');
        if (!username) {
            // Si no hay usuario logueado, redirigir al index
            window.location.href = 'index.html';
            return;
        }
        // Mostrar el nombre de usuario
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = username;
        }

        // Cargar descripción del usuario
        fetch('/api/user-profile?username=' + username)
            .then(response => response.json())
            .then(data => {
                if (data.description) {
                    document.getElementById('description').value = data.description;
                }
            })
            .catch(error => console.error('Error:', error));

        // Manejar el guardado del perfil
        const saveProfileButton = document.getElementById('save-profile');
        if (saveProfileButton) {
            saveProfileButton.addEventListener('click', function() {
                const description = document.getElementById('description').value;
                
                fetch('/api/update-profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        description: description
                    })
                })
                .then(response => {
                    if (response.ok) {
                        alert('Perfil actualizado correctamente');
                    } else {
                        alert('Error al actualizar el perfil');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error al actualizar el perfil');
                });
            });
        }

        // Lista de nombres para shaders
        const nombresVisuales = [
            "supervisualx",
            "altoshadermagic",
            "sexyshaderblast",
            "atmosferaastralwave",
            "espaciolocovibes",
            "visualdimension",
            "altoreality",
            "shadergalaxy",
            "sexyuniverse",
            "astrallandscape",
            "espaciopixel",
            "supernovaeffect",
            "altoluminance",
            "shaderdreams",
            "sexyvisualizer",
            "astraltravel",
            "locovision",
            "visualshader",
            "astralpulse",
            "espaciocolor",
            "highastral",
            "cosmicshader",
            "superastronauta",
            "locoshadervibes",
            "sexyatmosfera",
            "altoespacio",
            "astralflow",
            "espaciocreativo",
            "visualexplosion",
            "shadersynthwave",
            "astralglitch",
            "altodimensional",
            "espaciolocoboom",
            "superdreamer",
            "shaderwild",
            "sexylaserwave",
            "astralvortex",
            "visualspatial",
            "locoespacial",
            "altosurrealismo",
            "shaderfusion",
            "espaciotranscend",
            "sexyhorizon",
            "astralvisualx",
            "superespaciotime",
            "wildshader",
            "sexycosmos",
            "altodreamland",
            "astralpixels",
            "shaderloops",
            "espaciolocomagic",
            "superlumine",
            "shadercosmic",
            "sexydimension",
            "atmosferalight",
            "altocosmos",
            "locoinfinite",
            "astralflowing",
            "visualcascade",
            "espaciolocoloop",
            "shaderzone",
            "altotemporal",
            "sexyatmosphere",
            "astraldynamics",
            "espaciotrippy",
            "locoshadereffect",
            "cosmicvortex",
            "sexyflamewave",
            "altouniverso",
            "astralbliss",
            "shaderfields",
            "visualdelirio",
            "espaciolocorift",
            "sexyreality",
            "shaderpulsewave",
            "astraldreamscape",
            "altorealm",
            "superlocovision",
            "visualclimax",
            "espaciovirtualx",
            "sexyshadertrip",
            "altoparallax",
            "shaderastronaut",
            "wilddimensional",
            "locovisualdream",
            "astraltrails",
            "espaciouniverso",
            "sexyexplorer",
            "altoglitcheffect",
            "superdimensivo",
            "atmosferatrip",
            "locoshadervortex",
            "espacioparallax",
            "sexyglitchx",
            "shaderrealidad",
            "superluminosity",
            "altotranscend",
            "sexyplanetarium",
            "astralrender",
            "locouniversovibes",
            "altocosmicflow",
            "supernebula",
            "visualintensity",
            "espaciowave",
            "shaderlightbeam",
            "sexygalactic",
            "astralexplorer",
            "wildvisualdreams",
            "espaciolightpulse",
            "cosmicatmosphere",
            "locolasertrip",
            "supervisualhorizon",
            "altorealities",
            "shaderdimensions",
            "sexyshadergalaxy",
            "astralsoundwave",
            "visualwavescape",
            "espaciovortex",
            "highshadervibes",
            "superdynamicshader",
            "locoluminance",
            "atmosferainfinita",
            "sexyvisualtrip",
            "shaderatmospherix",
            "superdimensionalvibes",
            "espaciolocoinfinity",
            "astrallumina",
            "cosmicpulse",
            "sexydreamland",
            "altorealidades",
            "visualmystic",
            "locoparallaxtrip",
            "espaciomotion",
            "shaderuniverse",
            "sexyhorizonscape",
            "altosoundscapes",
            "superrealityvision",
            "astralglow",
            "shadervibrations",
            "sexygalaxypulse",
            "espaciotranscend",
            "visualinfinity",
            "locodimension",
            "superastralflow",
            "shaderdreamtrails",
            "sexydreamvortex",
            "altocosmicwave",
            "cosmicdimensions",
            "visualshaderrift",
            "sexyastralflow",
            "locovortexwave",
            "superplanetwave",
            "altomotionfx",
            "visualsupernova",
            "espaciolocoflow",
            "shaderlightstorm",
            "superwildpulse",
            "sexyvisualspace",
            "cosmicsymphony",
            "espaciotemporal",
            "visualdelirium",
            "locoshaderexplore",
            "supernovaexplorer",
            "altovirtualwave",
            "shaderinfinite",
            "sexygalacticdream",
            "astraltextures",
            "espaciolightfield",
            "superplanettrip",
            "shadermyst",
            "sexyluminosity",
            "lococosmictrails",
            "visualspectrum",
            "atmosferadream",
            "sexyflowtrails",
            "shaderwildblast",
            "visualgalaxytrip",
            "locouniversex",
            "cosmicvisualwave",
            "superastrallight",
            "sexyparallaxtrip",
            "shadermotionpulse",
            "altospacescape",
            "locorealities",
            "superflowvisual",
            "astralwavescape",
            "visualshockwave",
            "locosynthwave",
            "sexyinfiniteloop",
            "shadertrailscape",
            "superhorizontrip",
            "espaciolocoexplore",
            "cosmicsounds",
            "altoshaderblast",
            "visualdreamfx",
            "locodreampulse",
            "espaciolumina",
            "atmosferaexplorer",
            "superhighvisual",
            "sexyshadervibes",
            "altodreamvision",
            "superinfiniteflow",
            "shadermagicfield",
            "astralpulselight",
            "visualbeamwave",
            "cosmicparallax",
            "locoinfinitespace",
            "espaciovisualmagic",
            "supertripdimension",
            "sexyvisualfield",
            "altocosmicmotion",
            "shaderlightdream",
            "visualinfinitex",
            "wildspacedream",
            "sexyastralvision",
            "altolightfield",
            "cosmicdreamwave",
            "supercosmicstorm",
            "visualspacedrift",
            "locogalaxyvibes"
        ];

        // Manejar la creación de nuevo shader
        const createShaderButton = document.getElementById('create-shader');
        if (createShaderButton) {
            createShaderButton.addEventListener('click', function() {
                const username = localStorage.getItem('username');
                if (!username) {
                    window.location.href = 'index.html';
                    return;
                }
                // Generar un nombre aleatorio de la lista
                const randomIndex = Math.floor(Math.random() * nombresVisuales.length);
                const randomName = nombresVisuales[randomIndex];
                // Redirigir a shader.html con el nombre aleatorio y newShader=true
                window.location.href = `shader.html?shader=${randomName}&newShader=true`;
            });
        }

        // Función para cargar los shaders del usuario
        async function loadUserShaders() {
            const username = localStorage.getItem('username');
            if (!username) return;

            try {
                const response = await fetch(`/api/user-shaders/${username}`);
                if (response.ok) {
                    const shaders = await response.json();
                    const shadersList = document.getElementById('my-shaders-list');
                    shadersList.innerHTML = ''; // Limpiar lista actual

                    shaders.forEach(shader => {
                        const shaderItem = document.createElement('li');
                        shaderItem.className = 'shader-item';
                        shaderItem.innerHTML = `
                            <div class="shader-info">
                                <h3>${shader.nombre}</h3>
                                <p>Última actualización: ${new Date(shader.fechaActualizacion).toLocaleDateString()}</p>
                            </div>
                            <div class="shader-actions">
                                <button onclick="window.location.href='shader.html?shader=${encodeURIComponent(shader.nombre)}'" class="edit-button">
                                    Editar
                                </button>
                            </div>
                        `;
                        shadersList.appendChild(shaderItem);
                    });

                    if (shaders.length === 0) {
                        shadersList.innerHTML = '<li class="no-shaders">No tienes shaders creados aún.</li>';
                    }
                }
            } catch (error) {
                console.error('Error al cargar shaders:', error);
            }
        }

        // Cargar los shaders cuando se carga la página
        loadUserShaders();
    }
});
