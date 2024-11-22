const { connectToDatabase, closeConnection } = require('./db');

async function updateAuthors() {
    try {
        const db = await connectToDatabase(true); // true para local
        const shadersCollection = db.collection('shaders');

        // Actualizar todos los shaders que tengan autor "Sistema" a "jptutorial"
        const result = await shadersCollection.updateMany(
            { autor: "Sistema" },
            { $set: { autor: "jptutorial" } }
        );

        console.log(`Actualizados ${result.modifiedCount} shaders`);
    } catch (error) {
        console.error('Error al actualizar autores:', error);
    } finally {
        await closeConnection();
    }
}

// Ejecutar la actualización
updateAuthors();
