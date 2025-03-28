document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const overlay = document.getElementById('overlay');
    const userInfo = document.querySelector('.user-info');
    const authControls = document.querySelector('.auth-controls');
    const usernameDisplay = document.querySelector('.username-display');
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');
    const logoutButton = document.getElementById('logout-button');
    const backToLoginButton = document.getElementById('back-to-login-button');

    // Determinar en qué página estamos
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const isUserPage = window.location.pathname.includes('user.html');
    const isShaderPage = window.location.pathname.includes('shader.html');

    // Funciones de utilidad
    function showLoginModal() {
        if (loginModal && overlay) {
            loginModal.style.display = 'block';
            overlay.style.display = 'block';
        }
    }

    function closeLoginModal() {
        if (loginModal && overlay) {
            loginModal.style.display = 'none';
            overlay.style.display = 'none';
            if (registerModal) {
                registerModal.style.display = 'none';
            }
        }
    }

    function showRegisterModal() {
        if (registerModal && loginModal) {
            registerModal.style.display = 'block';
            loginModal.style.display = 'none';
        }
    }

    // Función para verificar si hay un usuario logueado
    function checkLoggedInUser() {
        const username = localStorage.getItem('username');
        
        if (!userInfo || !authControls || !usernameDisplay) return;

        if (username) {
            // Usuario logueado
            userInfo.style.display = 'flex';
            authControls.style.display = 'none';
            usernameDisplay.textContent = username;
            console.log('Usuario logueado:', username); // Debug
        } else {
            // Usuario no logueado
            userInfo.style.display = 'none';
            authControls.style.display = 'flex';
            console.log('No hay usuario logueado'); // Debug
        }
    }

    // Función para cerrar sesión
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        checkLoggedInUser();
        if (!isIndexPage) {
            window.location.href = 'index.html';
        }
    }

    // Event Listeners
    loginButton?.addEventListener('click', showLoginModal);
    signupButton?.addEventListener('click', showRegisterModal);
    logoutButton?.addEventListener('click', logout);
    backToLoginButton?.addEventListener('click', () => {
        if (registerModal) {
            registerModal.style.display = 'none';
        }
        showLoginModal();
    });
    overlay?.addEventListener('click', closeLoginModal);

    // Manejar el envío del formulario de inicio de sesión
    const loginForm = document.getElementById('login-form');
    loginForm?.addEventListener('submit', async function(event) {
        event.preventDefault();
        const username = this[0].value;
        const password = this[1].value;

        try {
            const response = await fetch('https://vps-4455523-x.dattaweb.com/shader/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', username);
                closeLoginModal();
                checkLoggedInUser();
                
                if (isIndexPage) {
                    window.location.href = 'user.html';
                } else {
                    checkLoggedInUser();
                }
            } else {
                console.error('Error de login:', data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Manejar el envío del formulario de registro
    const registerForm = document.getElementById('register-form');
    registerForm?.addEventListener('submit', async function(event) {
        event.preventDefault();
        const username = this[0].value;
        const email = this[1].value;
        const password = this[2].value;

        try {
            const response = await fetch('https://vps-4455523-x.dattaweb.com/shader/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                if (registerModal) {
                    registerModal.style.display = 'none';
                }
                showLoginModal();
            } else {
                console.error('Error de registro:', data.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Verificar estado de autenticación al cargar la página
    checkLoggedInUser();

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
        fetch(`https://vps-4455523-x.dattaweb.com/shader/api/user-profile?username=${username}`)
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
                
                fetch('https://vps-4455523-x.dattaweb.com/shader/api/update-profile', {
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
                        console.log('Perfil actualizado correctamente');
                    } else {
                        console.error('Error al actualizar el perfil:', response.statusText);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
            });
        }

        // Lista de nombres para shaders
        const nombresVisuales = [
            "supervisualx", "altoshadermagic", "sexyshaderblast", "atmosferaastralwave",
            "espaciolocovibes", "visualdimension", "altoreality", "shadergalaxy",
            "sexyuniverse", "astrallandscape", "espaciopixel", "supernovaeffect",
            "altoluminance", "shaderdreams", "sexyvisualizer", "astraltravel",
            "locovision", "visualshader", "astralpulse", "espaciocolor",
            "highastral", "cosmicshader", "superastronauta", "locoshadervibes",
            "sexyatmosfera", "altoespacio", "astralflow", "espaciocreativo",
            "visualexplosion", "shadersynthwave", "astralglitch", "altodimensional",
            "espaciolocoboom", "superdreamer", "shaderwild", "sexylaserwave",
            "astralvortex", "visualspatial", "locoespacial", "altosurrealismo",
            "shaderfusion", "espaciotranscend", "sexyhorizon", "astralvisualx",
            "superespaciotime", "wildshader", "sexycosmos", "altodreamland",
            "astralpixels", "shaderloops", "espaciolocomagic", "superlumine",
            "shadercosmic", "sexydimension", "atmosferalight", "altocosmos",
            "locoinfinite", "astralflowing", "visualcascade", "espaciolocoloop",
            "shaderzone", "altotemporal", "sexyatmosphere", "astraldynamics",
            "espaciotrippy", "locoshadereffect", "cosmicvortex", "sexyflamewave",
            "altouniverso", "astralbliss", "shaderfields", "visualdelirio",
            "espaciolocorift", "sexyreality", "shaderpulsewave", "astraldreamscape",
            "altorealm", "superlocovision", "visualclimax", "espaciovirtualx",
            "sexyshadertrip", "altoparallax", "shaderastronaut", "wilddimensional",
            "locovisualdream", "astraltrails", "espaciouniverso", "sexyexplorer",
            "altoglitcheffect", "superdimensivo", "atmosferatrip", "locoshadervortex",
            "espacioparallax", "sexyglitchx", "shaderrealidad", "superluminosity",
            "altotranscend", "sexyplanetarium", "astralrender", "locouniversovibes",
            "altocosmicflow", "supernebula", "visualintensity", "espaciowave",
            "shaderlightbeam", "sexygalactic", "astralexplorer", "wildvisualdreams",
            "espaciolightpulse", "cosmicatmosphere", "locolasertrip", "supervisualhorizon",
            "altorealities", "shaderdimensions", "sexyshadergalaxy", "astralsoundwave",
            "visualwavescape", "espaciovortex", "highshadervibes", "superdynamicshader",
            "locoluminance", "atmosferainfinita", "sexyvisualtrip", "shaderatmospherix",
            "superdimensionalvibes", "espaciolocoinfinity", "astrallumina", "cosmicpulse",
            "sexydreamland", "altorealidades", "visualmystic", "locoparallaxtrip",
            "espaciomotion", "shaderuniverse", "sexyhorizonscape", "altosoundscapes",
            "superrealityvision", "astralglow", "shadervibrations", "sexygalaxypulse",
            "espaciobeyond", "visualinfinity", "locodimension", "superastralflow",
            "shaderdreamtrails", "sexydreamvortex", "altocosmicwave", "cosmicdimensions",
            "visualshaderrift", "sexyastralflow", "locovortexwave", "superplanetwave",
            "altomotionfx", "visualsupernova", "espaciolocoflow", "shaderlightstorm",
            "superwildpulse", "sexyvisualspace", "cosmicsymphony", "espaciotemporal",
            "visualdelirium", "locoshaderexplore", "supernovaexplorer", "altovirtualwave",
            "shaderinfinite", "sexygalacticdream", "astraltextures", "espaciolightfield",
            "superplanettrip", "shadermyst", "sexyluminosity", "lococosmictrails",
            "visualspectrum", "atmosferadream", "sexyflowtrails", "shaderwildblast",
            "visualgalaxytrip", "locouniversex", "cosmicvisualwave", "superastrallight",
            "sexyparallaxtrip", "shadermotionpulse", "altospacescape", "locorealities",
            "superflowvisual", "astralwavescape", "visualshockwave", "locosynthwave",
            "sexyinfiniteloop", "shadertrailscape", "superhorizontrip", "espaciolocoexplore",
            "cosmicsounds", "altoshaderblast", "visualdreamfx", "locodreampulse",
            "espaciolumina", "atmosferaexplorer", "superhighvisual", "sexyshadervibes",
            "altodreamvision", "superinfiniteflow", "shadermagicfield", "astralpulselight",
            "visualbeamwave", "cosmicparallax", "locoinfinitespace", "espaciovisualmagic",
            "supertripdimension", "sexyvisualfield", "altocosmicmotion", "shaderlightdream",
            "visualinfinitex", "wildspacedream", "sexyastralvision", "altolightfield",
            "cosmicdreamwave", "supercosmicstorm", "visualspacedrift", "locogalaxyvibes"
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
                window.location.href = `${CONFIG.BASE_URL}/shader.html?shader=${randomName}&newShader=true`;
            });
        }

        // Función para cargar los shaders del usuario
        async function loadUserShaders() {
            const username = localStorage.getItem('username');
            if (!username) return;

            try {
                const response = await fetch(`https://vps-4455523-x.dattaweb.com/shader/api/user-shaders/${username}`);
                if (response.ok) {
                    const shaders = await response.json();
                    const shadersList = document.getElementById('my-shaders-list');
                    shadersList.innerHTML = ''; // Limpiar lista actual

                    shaders.forEach(shader => {
                        const shaderItem = document.createElement('li');
                        shaderItem.className = 'shader-item';
                        
                        // Crear y configurar la imagen de preview
                        const shaderPreview = document.createElement('img');
                        shaderPreview.src = `https://vps-4455523-x.dattaweb.com/shader/img/previews/${shader.nombre}.png`;
                        shaderPreview.alt = `Preview de ${shader.nombre}`;
                        shaderPreview.className = 'user-shader-preview';
                        /*shaderPreview.onerror = () => {
                            shaderPreview.src = 'img/previews/placeholder.png';
                        };*/
                        
                        // Crear el título
                        const shaderTitle = document.createElement('h3');
                        shaderTitle.className = 'shader-title';
                        shaderTitle.textContent = shader.nombre;
                        
                        // Crear el botón de editar
                        const editButton = document.createElement('button');
                        editButton.className = 'edit-shader-btn';
                        editButton.textContent = 'Editar';
                        editButton.onclick = () => {
                            window.location.href = `${CONFIG.BASE_URL}/shader.html?shader=${encodeURIComponent(shader.nombre)}`;
                        };
                        
                        // Agregar elementos al item
                        shaderItem.appendChild(shaderPreview);
                        shaderItem.appendChild(shaderTitle);
                        shaderItem.appendChild(editButton);
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
