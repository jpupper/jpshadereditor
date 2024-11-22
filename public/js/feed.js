// Función para cargar la lista de shaders
async function loadShaders() {
    try {
        const response = await fetch('/api/shaders');
        if (!response.ok) {
            throw new Error('Error al cargar shaders');
        }
        const shaders = await response.json();
        const shadersList = document.getElementById('shaders-list');

        shaders.forEach(shader => {
            const shaderContainer = document.createElement('div');
            shaderContainer.className = 'shader-container'; // Clase para el contenedor del shader

            const shaderLink = document.createElement('a');
            shaderLink.href = `/shader.html?shader=${encodeURIComponent(shader.nombre)}`; // Cambia la URL según sea necesario
            shaderLink.className = 'shader-link'; // Clase para el enlace del shader

            const shaderTitle = document.createElement('h3');
            shaderTitle.textContent = shader.nombre; // Título del shader
            shaderTitle.className = 'shader-title'; // Clase para el título

            const shaderAuthor = document.createElement('div');
            shaderAuthor.textContent = `Autor: ${shader.autor}`;
            shaderAuthor.className = 'shader-author'; // Clase para el autor

            // Crear un elemento de imagen para mostrar el preview
            const shaderImage = document.createElement('img');
            shaderImage.src = `img/previews/${shader.nombre}.png`; // Ruta de la imagen
            shaderImage.alt = `Preview de ${shader.nombre}`; // Texto alternativo
            shaderImage.className = 'shader-image'; // Clase para la imagen
            shaderImage.onerror = () => {
                // Si la imagen no se encuentra, mostrar una imagen de marcador de posición
                shaderImage.src = 'img/previews/placeholder.png'; // Asegúrate de tener un placeholder
            };

            // Agregar los elementos al enlace
            shaderLink.appendChild(shaderTitle);
            shaderLink.appendChild(shaderAuthor);
            shaderLink.appendChild(shaderImage);

            // Agregar el enlace al contenedor
            shaderContainer.appendChild(shaderLink);
            shadersList.appendChild(shaderContainer);
        });
    } catch (error) {
        console.error('Error al cargar la lista de shaders:', error);
        document.getElementById('shaders-list').textContent = 'Error al cargar shaders.';
    }
}

// Cargar shaders al cargar la página
window.onload = loadShaders;
