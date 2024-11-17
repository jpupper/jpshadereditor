const fs = require('fs');
const path = require('path');
const { connectToDatabase, closeConnection } = require('./db');

const isRunningLocal = true;

async function checkAndLoadShaders() {
    const db = await connectToDatabase(isRunningLocal);
    const shadersCollection = db.collection('shaders');
    const shadersDir = path.join(__dirname, 'public', 'sh');

    try {
        const count = await shadersCollection.countDocuments();
        if (count > 0) {
            console.log('Los shaders ya están cargados.');
            return;
        }

        console.log('Los shaders no están cargados, cargándolos...');
        const files = fs.readdirSync(shadersDir);

        for (const file of files) {
            if (path.extname(file) === '.frag') {
                const nombre = path.basename(file, '.frag');
                const contenido = fs.readFileSync(path.join(shadersDir, file), 'utf8');
                const fecha = new Date().toISOString();

                try {
                    await shadersCollection.insertOne({
                        nombre,
                        contenido,
                        fecha,
                        autor: 'Sistema',
                    });
                    console.log(`Shader "${nombre}" subido exitosamente.`);
                } catch (err) {
                    console.error(`Error subiendo shader ${nombre}:`, err);
                }
            }
        }
    } catch (error) {
        console.error('Error al verificar o subir shaders:', error);
        throw error;
    } finally {
        await closeConnection();
    }
}

module.exports = {
    checkAndLoadShaders,
};
