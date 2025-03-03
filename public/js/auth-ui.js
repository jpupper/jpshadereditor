// Función para crear y agregar los elementos de autenticación al DOM
function initializeAuthUI() {
    // Crear el contenedor principal
    const authContainer = document.createElement('div');
    authContainer.id = 'auth-container';
    
    // Crear la estructura HTML
    authContainer.innerHTML = `
        <div class="auth-buttons">
            <div class="auth-controls">
                <button type="button" class="auth-button" id="login-button">Iniciar Sesión</button>
                <button type="button" class="auth-button" id="signup-button">Registrarse</button>
            </div>
            
            <div class="user-info" style="display: none;">
                <span class="username-display"></span>
                <button type="button" class="auth-button" id="profile-button">Mi Perfil</button>
                <button type="button" class="auth-button" id="logout-button">Cerrar Sesión</button>
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
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthUI();
    
    // Add profile button event listener
    document.getElementById('profile-button')?.addEventListener('click', () => {
        window.location.href = 'user.html';
    });

    // Add login/logout handlers
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        // ... existing login logic ...
        
        // After successful login, update save button visibility
        const shaderAuthor = document.getElementById('shader-author')?.value;
        if (typeof window.actualizarVisibilidadBotonGuardar === 'function') {
            window.actualizarVisibilidadBotonGuardar(shaderAuthor);
        }
    });

    document.getElementById('logout-button')?.addEventListener('click', () => {
        // ... existing logout logic ...
        
        // After logout, update save button visibility
        if (typeof window.actualizarVisibilidadBotonGuardar === 'function') {
            window.actualizarVisibilidadBotonGuardar('');
        }
    });
});
