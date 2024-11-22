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
            // ... (lista de nombres)
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
                        
                        // Crear y configurar la imagen de preview
                        const shaderPreview = document.createElement('img');
                        shaderPreview.src = `img/previews/${shader.nombre}.png`;
                        shaderPreview.alt = `Preview de ${shader.nombre}`;
                        shaderPreview.className = 'shader-preview';
                        shaderPreview.onerror = () => {
                            shaderPreview.src = 'img/previews/placeholder.png';
                        };
                        
                        // Crear el título
                        const shaderTitle = document.createElement('h3');
                        shaderTitle.className = 'shader-title';
                        shaderTitle.textContent = shader.nombre;
                        
                        // Crear el botón de editar
                        const editButton = document.createElement('button');
                        editButton.className = 'edit-shader-btn';
                        editButton.textContent = 'Editar';
                        editButton.onclick = () => {
                            window.location.href = `shader.html?shader=${encodeURIComponent(shader.nombre)}`;
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
