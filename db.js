const { MongoClient } = require('mongodb');

// Configuración de MongoDB Atlas
const atlasUrl = 'mongodb+srv://jpupper:ayp0624@jpshader.w1wcv.mongodb.net/?retryWrites=true&w=majority&appName=jpshader';
const localUrl = 'mongodb://localhost:27017';

let client;
const dbNameLocal = 'shadersDB'; // Nombre de la base de datos en modo local
const dbNameAtlas = 'jpshader'; // Nombre de la base de datos en MongoDB Atlas

function connectToDatabase(isRunningLocal) {
    const url = isRunningLocal ? localUrl : atlasUrl;
    client = new MongoClient(url);
    return client.connect().then(() => {
        console.log('Conectado a MongoDB');
        return client.db(isRunningLocal ? dbNameLocal : dbNameAtlas); // Usar el nombre de base de datos correcto
    });
}

async function closeConnection() {
    await client.close();
    console.log('Conexión cerrada.');
}

module.exports = {
    connectToDatabase,
    closeConnection,
}; 