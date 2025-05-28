const { connectToDatabase } = require('./db');

async function migrateUsers() {
    let db = null;
    try {
        console.log('Conectando a la base de datos Atlas...');
        db = await connectToDatabase(false); // false para usar Atlas
        
        // Verificar la base de datos y colecciones
        console.log('Nombre de la base de datos:', db.databaseName);
        const collections = await db.listCollections().toArray();
        console.log('Colecciones disponibles:', collections.map(c => c.name));
        
        const usersCollection = db.collection('users');
        
        // Verificar usuarios existentes
        const totalUsers = await usersCollection.countDocuments();
        console.log('Total de usuarios encontrados:', totalUsers);
        
        // Mostrar todos los usuarios
        const allUsers = await usersCollection.find().toArray();
        console.log('\nEstado actual de todos los usuarios:');
        allUsers.forEach(user => {
            console.log(`\nUsuario: ${user.username}`);
            console.log(`Prompts restantes: ${user.promptsRemaining !== undefined ? user.promptsRemaining : 'NO DEFINIDO'}`);
            console.log('Datos completos:', JSON.stringify(user, null, 2));
        });
        
        // Actualizar todos los usuarios que no tengan promptsRemaining
        const result = await usersCollection.updateMany(
            { promptsRemaining: { $exists: false } },
            { $set: { promptsRemaining: 10 } }
        );
        
        console.log(`Migración completada. ${result.modifiedCount} usuarios actualizados.`);
    } catch (error) {
        console.error('Error durante la migración:', error);
    } finally {
        if (db) {
            await db.client.close();
        }
    }
}

migrateUsers();
