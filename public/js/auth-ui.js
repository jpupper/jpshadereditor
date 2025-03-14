// Función para crear y agregar los elementos de autenticación al DOM
function initializeAuthUI() {
    // Crear el contenedor principal
    const authContainer = document.createElement('div');
    authContainer.id = 'auth-container';
    
    // Crear la estructura HTML
    authContainer.innerHTML = `
        <div class="auth-buttons">
            <div class="auth-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                </svg>
            </div>
            
            <div class="auth-controls">
                <button type="button" class="auth-button" id="login-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 7L9.6 8.4L12.2 11H2V13H12.2L9.6 15.6L11 17L16 12L11 7Z" fill="currentColor"/>
                    </svg>
                    Login
                </button>
                <button type="button" class="auth-button" id="signup-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 12C17.21 12 19 10.21 19 8C19 5.79 17.21 4 15 4C12.79 4 11 5.79 11 8C11 10.21 12.79 12 15 12ZM6 10V7H4V10H1V12H4V15H6V12H9V10H6ZM15 14C12.33 14 7 15.34 7 18V20H23V18C23 15.34 17.67 14 15 14Z" fill="currentColor"/>
                    </svg>
                    Register
                </button>
            </div>
            
            <div class="user-info" style="display: none;">
                <span class="username-display"></span>
                <button type="button" class="auth-button" id="profile-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                    </svg>
                    Profile
                </button>
                <button type="button" class="auth-button" id="logout-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 7L15.6 8.4L18.2 11H8V13H18.2L15.6 15.6L17 17L22 12L17 7Z" fill="currentColor"/>
                    </svg>
                    Logout
                </button>
            </div>
        </div>

        <div class="auth-modals">
            <div id="login-modal" class="modal" tabindex="-1">
                <div class="modal-content">
                    <h2>Iniciar Sesión</h2>
                    <form id="login-form">
                        <input type="text" placeholder="Usuario" required>
                        <input type="password" placeholder="Contraseña" required>
                        <button type="submit" class="modal-button">Iniciar Sesión</button>
                    </form>
                </div>
            </div>

            <div id="register-modal" class="modal" tabindex="-1">
                <div class="modal-content">
                    <h2>Registro</h2>
                    <form id="register-form">
                        <input type="text" placeholder="Usuario" required>
                        <input type="email" placeholder="Correo" required>
                        <input type="password" placeholder="Contraseña" required>
                        <button type="submit" class="modal-button">Registrarse</button>
                        <button type="button" class="modal-button secondary" id="back-to-login-button">
                            Volver a Iniciar Sesión
                        </button>
                    </form>
                </div>
            </div>

            <div id="overlay"></div>
        </div>
    `;

    // Agregar al DOM
    document.body.insertBefore(authContainer, document.body.firstChild);

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    const authButtons = document.querySelector('.auth-buttons');
    const authControls = document.querySelector('.auth-controls');
    const userInfo = document.querySelector('.user-info');
    let timeoutId;

    // Handle hover interactions
    function handleMouseEnter() {
        clearTimeout(timeoutId);
        const username = localStorage.getItem('username');
        if (username) {
            document.querySelector('.username-display').textContent = username;
            userInfo.style.display = 'block';
            authControls.style.display = 'none';
        } else {
            authControls.style.display = 'block';
            userInfo.style.display = 'none';
        }
    }

    function handleMouseLeave() {
        timeoutId = setTimeout(() => {
            authControls.style.display = 'none';
            userInfo.style.display = 'none';
        }, 300); // Small delay to allow moving to dropdown
    }

    authButtons.addEventListener('mouseenter', handleMouseEnter);
    authButtons.addEventListener('mouseleave', handleMouseLeave);
    authControls.addEventListener('mouseenter', () => clearTimeout(timeoutId));
    authControls.addEventListener('mouseleave', handleMouseLeave);
    userInfo.addEventListener('mouseenter', () => clearTimeout(timeoutId));
    userInfo.addEventListener('mouseleave', handleMouseLeave);

    // Add profile button event listener
    document.getElementById('profile-button')?.addEventListener('click', () => {
        window.location.href = 'user.html';
    });

    // Add login/logout handlers
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        // ... existing login logic ...
        
        // After successful login, update UI
        const username = document.querySelector('#login-form input[type="text"]').value;
        updateAuthUIState(true, username);
        
        // Update save button visibility
        const shaderAuthor = document.getElementById('shader-author')?.value;
        if (typeof window.actualizarVisibilidadBotonGuardar === 'function') {
            window.actualizarVisibilidadBotonGuardar(shaderAuthor);
        }
    });

    document.getElementById('logout-button')?.addEventListener('click', () => {
        // ... existing logout logic ...
        
        // After logout, update UI
        updateAuthUIState(false);
        
        // Update save button visibility
        if (typeof window.actualizarVisibilidadBotonGuardar === 'function') {
            window.actualizarVisibilidadBotonGuardar('');
        }
    });
}

function updateAuthUIState(loggedIn, username) {
    const authControls = document.querySelector('.auth-controls');
    const userInfo = document.querySelector('.user-info');
    const usernameDisplay = document.querySelector('.username-display');
    
    if (loggedIn && username) {
        localStorage.setItem('username', username);
        usernameDisplay.textContent = username;
        authControls.style.display = 'none';
        userInfo.style.display = 'block';
    } else {
        localStorage.removeItem('username');
        usernameDisplay.textContent = '';
        authControls.style.display = 'block';
        userInfo.style.display = 'none';
    }
}

function isLoggedIn() {
    return localStorage.getItem('username') !== null;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthUI();
    
    // Check initial login state
    const username = localStorage.getItem('username');
    if (username) {
        updateAuthUIState(true, username);
    }
});
