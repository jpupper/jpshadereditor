const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Configuración de MongoDB Atlas
const atlasUrl = 'mongodb+srv://jpupper:ayp0624@jpshader.w1wcv.mongodb.net/?retryWrites=true&w=majority&appName=jpshader';
const client = new MongoClient(atlasUrl);
const dbName = 'jpshader';

// Configuración local (comentada)
const localUrl = 'mongodb://localhost:27017';
// const client = new MongoClient(localUrl);

async function checkAndLoadShaders() {
    const db = client.db(dbName);
    const shadersCollection = db.collection('shaders');
    const shadersDir = path.join(__dirname, 'public', 'sh');

    try {
        // Conexión a la base de datos
        await client.connect();
        console.log('Conectado a MongoDB');

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
        await client.close();
        console.log('Conexión cerrada.');
    }
}

module.exports = {
    checkAndLoadShaders,
};
