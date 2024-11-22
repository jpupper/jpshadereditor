const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const uploadShaders = require('./uploadshaders');
const cors = require('cors');
const { connectToDatabase, closeConnection } = require('./db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const isRunningLocal = false;
const PORT = process.env.PORT || 3250;
let db = null;
// Agregar el Map para las conexiones activas
const activeConnections = new Map();

// Función para conectar a la base de datos
async function connectToDatabaseWrapper() {
    if (db) return db;

    try {
        db = await connectToDatabase(isRunningLocal);
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
        const db = await connectToDatabaseWrapper();
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
        const db = await connectToDatabaseWrapper();
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

app.get('/api/shader-exists/:nombre', async (req, res) => {
    try {
        const db = await connectToDatabaseWrapper();
        const shadersCollection = db.collection('shaders');
        const shader = await shadersCollection.findOne({ nombre: req.params.nombre });
        res.json({ exists: !!shader });
    } catch (error) {
        console.error('Error al verificar shader:', error);
        res.status(500).json({ error: 'Error al verificar shader' });
    }
});

app.post('/api/shaders', async (req, res) => {
    try {
        const { nombre, autor, contenido } = req.body;

        if (!nombre || !autor || !contenido) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const db = await connectToDatabaseWrapper();
        const shadersCollection = db.collection('shaders');

        // Verificar si ya existe un shader con ese nombre
        const existingShader = await shadersCollection.findOne({ nombre: nombre });
        if (existingShader) {
            return res.status(409).json({ error: 'Ya existe un shader con ese nombre' });
        }

        // Crear nuevo shader
        const result = await shadersCollection.insertOne({
            nombre,
            autor,
            contenido,
            fechaCreacion: new Date(),
            fechaActualizacion: new Date()
        });

        res.status(201).json({ message: 'Shader guardado exitosamente', id: result.insertedId });
    } catch (error) {
        console.error('Error al guardar el shader:', error);
        res.status(500).json({ error: 'Error al guardar el shader' });
    }
});

// Ruta para guardar la imagen
app.post('/api/save-image', async (req, res) => {
    const { image, name } = req.body;

    // Verificar que se haya proporcionado un nombre
    if (!name) {
        return res.status(400).json({ error: 'Falta el nombre del shader' });
    }

    // Eliminar el prefijo de la imagen base64
    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    const filePath = path.join(__dirname, 'public', 'img', 'previews', `${name}.png`); // Guardar en img/previews

    try {
        // Guardar la imagen en el sistema de archivos
        fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
        res.status(200).json({ message: 'Imagen guardada exitosamente' });
    } catch (error) {
        console.error('Error al guardar la imagen:', error);
        res.status(500).json({ error: 'Error al guardar la imagen' });
    }
});

// Archivos estáticos
app.use(express.static('public'));

// Crear la carpeta de previews si no existe
const previewsDir = path.join(__dirname, 'public', 'img', 'previews');
if (!fs.existsSync(previewsDir)) {
    fs.mkdirSync(previewsDir, { recursive: true });
}

// Ruta para registrar un nuevo usuario
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        const db = await connectToDatabaseWrapper();
        const usersCollection = db.collection('users');

        // Verificar si el usuario ya existe
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Guardar el nuevo usuario
        await usersCollection.insertOne({
            username,
            email,
            password: hashedPassword,
        });

        // Aquí puedes establecer la sesión del usuario si estás usando sesiones
        // req.session.userId = newUser._id; // Ejemplo de cómo establecer la sesión

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});

// Ruta para obtener el usuario actual
app.get('/api/user', async (req, res) => {
    const userId = req.session.userId; // Ejemplo usando sesiones

    if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    try {
        const db = await connectToDatabaseWrapper();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ _id: userId }, { projection: { password: 0 } }); // No devolver la contraseña

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error al obtener el usuario:', error);
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
});

// Ruta para iniciar sesión
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        const db = await connectToDatabaseWrapper();
        const usersCollection = db.collection('users');

        // Buscar el usuario por nombre de usuario
        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        // Verificar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        // Aquí puedes establecer la sesión del usuario si estás usando sesiones
        // req.session.userId = user._id; // Ejemplo de cómo establecer la sesión

        res.status(200).json({ message: 'Inicio de sesión exitoso' });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// Rutas para el perfil de usuario
app.get('/api/user-profile', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ error: 'Se requiere el nombre de usuario' });
        }

        const db = await connectToDatabaseWrapper();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            username: user.username,
            description: user.description || ''
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error al obtener el perfil' });
    }
});

app.post('/api/update-profile', async (req, res) => {
    try {
        const { username, description } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Se requiere el nombre de usuario' });
        }

        const db = await connectToDatabaseWrapper();
        const usersCollection = db.collection('users');
        
        await usersCollection.updateOne(
            { username },
            { $set: { description } },
            { upsert: false }
        );

        res.json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al actualizar el perfil' });
    }
});

app.post('/api/create-shader', async (req, res) => {
    try {
        const { name, author, code } = req.body;
        if (!name || !author || !code) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const db = await connectToDatabaseWrapper();
        const shadersCollection = db.collection('shaders');

        const result = await shadersCollection.insertOne({
            nombre: name,
            autor: author,
            contenido: code,
            fechaCreacion: new Date(),
            fechaActualizacion: new Date()
        });

        res.status(201).json({ 
            message: 'Shader creado correctamente',
            id: result.insertedId 
        });
    } catch (error) {
        console.error('Error al crear shader:', error);
        res.status(500).json({ error: 'Error al crear el shader' });
    }
});

// Endpoint para obtener los shaders de un usuario específico
app.get('/api/user-shaders/:username', async (req, res) => {
    try {
        const db = await connectToDatabaseWrapper();
        const shadersCollection = db.collection('shaders');
        const shaders = await shadersCollection.find({ autor: req.params.username }).toArray();
        
        console.log('Obteniendo shaders del usuario:', req.params.username);
        console.log('Shaders encontrados:', shaders.length);
        
        res.json(shaders);
    } catch (error) {
        console.error('Error al obtener shaders del usuario:', error);
        res.status(500).json({ error: 'Error al obtener shaders del usuario' });
    }
});

// Iniciar el servidor
async function startServer() {
    try {
        await connectToDatabaseWrapper();

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
            socket.broadcast.emit("pedirShader","holaman"); //Esto es para que ucando un nuevo cliente entra se acutaliza con el shader con el que se esta trabajando que es como la ultima sesion. 
            const origin = socket.handshake.headers.origin || 'Origen desconocido';
            const isAdmin = socket.handshake.headers.referer?.includes('admin.html');

            // Variable para determinar si es una nueva conexión
            let isNewConnection = true;

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
                    if (!isNewConnection) { // Solo emitir si no es una nueva conexión
                        socket.broadcast.emit('shaderUpdate', {
                            id: socket.id,
                            nombre: data.nombre,
                            autor: data.autor,
                            contenido: data.contenido,
                        });
                    }
                }
            });

            socket.on('disconnect', () => {
                console.log('Desconexión:', socket.id);
                activeConnections.delete(socket.id);
                io.emit('connectionsUpdate', Array.from(activeConnections.values()));
            });

            // Restablecer el estado de nueva conexión después de un breve retraso
            setTimeout(() => {
                isNewConnection = false; // Restablecer el estado después de un tiempo
            }, 500); // Ajusta el tiempo según sea necesario
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
