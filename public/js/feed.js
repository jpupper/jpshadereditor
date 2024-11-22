// Función para cargar la lista de shaders
async function loadShaders() {
    try {
        const response = await fetch('/api/shaders');
        if (!response.ok) {
            throw new Error('Error al cargar shaders');
        }
        const shaders = await response.json();
        const shadersList = document.getElementById('shaders-list');
        shadersList.className = 'shader-container';

        shaders.forEach(shader => {
            const shaderCard = document.createElement('a');
            shaderCard.href = `/shader.html?shader=${encodeURIComponent(shader.nombre)}`;
            shaderCard.className = 'shader-card';

            // Crear la sección de preview
            const preview = document.createElement('div');
            preview.className = 'shader-preview';
            const previewImg = document.createElement('img');
            previewImg.src = `img/previews/${shader.nombre}.png`;
            previewImg.alt = `Preview de ${shader.nombre}`;
            previewImg.onerror = () => {
                previewImg.src = 'img/previews/placeholder.png';
            };
            preview.appendChild(previewImg);

            // Crear la sección de información
            const info = document.createElement('div');
            info.className = 'shader-info';

            const title = document.createElement('h3');
            title.className = 'shader-title';
            title.textContent = shader.nombre;

            const author = document.createElement('div');
            author.className = 'shader-author';
            author.textContent = `Por: ${shader.autor}`;

            info.appendChild(title);
            info.appendChild(author);

            // Agregar todo a la tarjeta
            shaderCard.appendChild(preview);
            shaderCard.appendChild(info);

            shadersList.appendChild(shaderCard);
        });
    } catch (error) {
        console.error('Error al cargar la lista de shaders:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Error al cargar shaders.';
        document.getElementById('shaders-list').appendChild(errorMessage);
    }
}

// Cargar shaders al cargar la página
document.addEventListener('DOMContentLoaded', loadShaders);
