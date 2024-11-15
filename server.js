const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { MongoClient } = require('mongodb');
const uploadShaders = require('./uploadshaders');
const cors = require('cors');

// Configuración de la base de datos
// Modo de producción con MongoDB Atlas
const atlasUrl = 'mongodb+srv://jpupper:ayp0624@jpshader.w1wcv.mongodb.net/?retryWrites=true&w=majority&appName=jpshader';

// Modo local (comentado para producción)
// const localUrl = 'mongodb://127.0.0.1:27017';
// const dbName = 'shadersDB';

const client = new MongoClient(atlasUrl); // Cambiar entre `atlasUrl` y `localUrl` según sea necesario
const dbName = 'jpshader'; // Este es el nombre de la base de datos que se usará

const PORT = process.env.PORT || 3250;
let db = null;

// Agregar el Map para las conexiones activas
const activeConnections = new Map();

// Función para conectar a la base de datos
async function connectToDatabase() {
    if (db) return db;

    try {
        await client.connect();
        console.log('Conectado a MongoDB');
        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
        throw error;
    }
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Límite para shaders grandes

// Rutas API
app.get('/api/shaders', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const shadersCollection = db.collection('shaders');
        const shaders = await shadersCollection.find({}).toArray();

        console.log('Endpoint /api/shaders llamado');
        console.log('Shaders encontrados:', shaders.length);

        res.json(shaders);
    } catch (error) {
        console.error('Error en /api/shaders:', error);
        res.status(500).json({ error: 'Error al obtener shaders' });
    }
});

app.get('/api/shaders/:nombre', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const shadersCollection = db.collection('shaders');
        const shader = await shadersCollection.findOne({ nombre: req.params.nombre });
        if (shader) {
            res.json(shader);
        } else {
            res.status(404).json({ error: 'Shader no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener el shader:', error);
        res.status(500).json({ error: 'Error al obtener el shader' });
    }
});

app.post('/api/shaders', async (req, res) => {
    try {
        const { nombre, autor, contenido } = req.body;

        if (!nombre || !autor || !contenido) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const db = await connectToDatabase();
        const shadersCollection = db.collection('shaders');

        // Intentar actualizar si existe, sino crear nuevo
        const result = await shadersCollection.updateOne(
            { nombre: nombre },
            {
                $set: {
                    autor,
                    contenido,
                    fechaActualizacion: new Date(),
                },
            },
            { upsert: true } // Crear si no existe
        );

        const mensaje =
            result.upsertedCount === 1
                ? 'Shader guardado exitosamente'
                : 'Shader actualizado exitosamente';

        res.status(201).json({ message: mensaje });
    } catch (error) {
        console.error('Error al guardar el shader:', error);
        res.status(500).json({ error: 'Error al guardar el shader' });
    }
});

// Archivos estáticos
app.use(express.static('public'));

// Iniciar el servidor
async function startServer() {
    try {
        await connectToDatabase();

        const server = http.listen(PORT, async () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
            try {
                await uploadShaders.checkAndLoadShaders();
            } catch (error) {
                console.error('Error al inicializar shaders:', error);
            }
        });

        // Configuración de Socket.IO
        io.on('connection', (socket) => {
            console.log('Nueva conexión:', socket.id);

            const origin = socket.handshake.headers.origin || 'Origen desconocido';
            const isAdmin = socket.handshake.headers.referer?.includes('admin.html');

            if (!isAdmin) {
                const urlParams = new URLSearchParams(socket.handshake.headers.referer.split('?')[1]);
                const shaderName = urlParams.get('shader');

                activeConnections.set(socket.id, {
                    id: socket.id,
                    origin: origin,
                    connectTime: new Date(),
                    lastActivity: new Date(),
                    isEditing: false,
                    currentShader: shaderName,
                    shaderInfo: {
                        nombre: shaderName,
                        autor: '',
                        contenido: '',
                    },
                });

                // Emitir la lista actualizada a todos los clientes
                io.emit('connectionsUpdate', Array.from(activeConnections.values()));
            }

            socket.on('shaderUpdate', (data) => {
                console.log('Datos recibidos en shaderUpdate:', data);
                if (activeConnections.has(socket.id)) {
                    const connection = activeConnections.get(socket.id);
                    connection.lastActivity = new Date();
                    connection.isEditing = true;
                    connection.currentShader = data.nombre;

                    // Actualizar la información del shader en activeConnections
                    connection.shaderInfo = {
                        nombre: data.nombre,
                        autor: data.autor,
                        contenido: data.contenido,
                    };

                    // Emitir a todos los clientes conectados al mismo shader, excepto al que lo originó
                    socket.broadcast.emit('shaderUpdate', {
                        id: socket.id,
                        nombre: data.nombre,
                        autor: data.autor,
                        contenido: data.contenido,
                    });
                }
            });

            socket.on('disconnect', () => {
                console.log('Desconexión:', socket.id);
                activeConnections.delete(socket.id);
                io.emit('connectionsUpdate', Array.from(activeConnections.values()));
            });
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Ruta para conexiones activas
app.get('/api/connections', (req, res) => {
    res.json(Array.from(activeConnections.values()));
});

startServer();
