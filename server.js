const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
	path: '/shader/socket.io',  // Configura el path correcto para socket.io
    cors: {
        origin: "*", // Asegúrate de configurar correctamente los CORS según tus necesidades
        methods: ["GET", "POST"]
    }
});

const uploadShaders = require('./uploadshaders');
const cors = require('cors');
const { connectToDatabase, closeConnection } = require('./db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
// const multer = require('multer'); // Quitar multer
const { apiConfig, validateApiKeys } = require('./api-config');
const fetch = require('node-fetch');

const isRunningLocal = false;
const PORT = process.env.PORT || 3250;
let db = null;
// Agregar el Map para las conexiones activas
const activeConnections = new Map();
// Map para mantener registro de shaders activos: shaderName -> {socketId, lastUpdate}
const activeShaders = new Map();

// Función para conectar a la base de datos
async function connectToDatabaseWrapper() {
    if (db) return db;

    try {
        console.log('Intentando conectar a MongoDB...');
        console.log('Modo:', isRunningLocal ? 'local' : 'Atlas');
        db = await connectToDatabase(isRunningLocal);
        const collections = await db.listCollections().toArray();
        console.log('Colecciones disponibles:', collections.map(c => c.name));
        console.log('Conexión exitosa a MongoDB');
        return db;
    } catch (error) {
        console.error('Error detallado al conectar a MongoDB:', error);
        console.error('Stack trace:', error.stack);
        throw error;
    }
}

// Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' })); // Límite para shaders grandes

// Logging middleware para ver las rutas solicitadas
app.use((req, res, next) => {
    //console.log('Requested URL:', req.url);
   // console.log('Full path:', path.join(__dirname, 'public', req.url));
    next();
});

// Servir archivos estáticos
app.use('/shader', express.static(path.join(__dirname, 'public')));

// Ruta específica para las imágenes de preview
app.use('/shader/img/previews', express.static(path.join(__dirname, 'public', 'img', 'previews')));

// Ruta principal para /shader
app.get('/shader', (req, res) => {
    res.send('Servidor de Shaders activo');
});
// Ruta principal para /shader
app.get('/pruebaloca', (req, res) => {
    res.send('Prueba de mensaje loco');
});
// Ruta raíz para respuesta de texto plano
app.get('/', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Carga app shaders');
});

// Endpoint temporal para verificar versión del código
app.get('/shader/api/test-version', (req, res) => {
    res.json({
        version: '2025-05-28-14:45',
        hasPromptsRemaining: true
    });
});

// Endpoint para obtener la configuración de la API
app.get('/shader/api/config', (req, res) => {
    // Solo enviamos la URL de la API, no la clave
    res.json({
        openai: {
            apiUrl: apiConfig.openai.apiUrl
        }
    });
});

// Nuevo endpoint para manejar las solicitudes a OpenAI desde el servidor
app.post('/shader/api/openai-proxy', async (req, res) => {
    try {
        // Verificar que la API key esté configurada
        if (!apiConfig.openai.apiKey) {
            return res.status(500).json({ error: 'API key no configurada en el servidor' });
        }

        // Obtener los datos de la solicitud
        const requestData = req.body;
        
        // Realizar la solicitud a OpenAI desde el servidor
        const response = await fetch(apiConfig.openai.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiConfig.openai.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error en proxy de OpenAI:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud a OpenAI' });
    }
});

// Rutas API
app.get('/shader/api/shaders', async (req, res) => {
    try {
        const db = await connectToDatabaseWrapper();
        const shadersCollection = db.collection('shaders');
        const shaders = await shadersCollection.find({}).toArray();

        console.log('Endpoint /shader/api/shaders llamado');
        console.log('Shaders encontrados:', shaders.length);

        res.json(shaders);
    } catch (error) {
        console.error('Error en /shader/api/shaders:', error);
        res.status(500).json({ error: 'Error al obtener shaders' });
    }
});

app.get('/shader/api/shaders/:nombre', async (req, res) => {
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

app.get('/shader/api/shader-exists/:nombre', async (req, res) => {
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

app.post('/shader/api/shaders', async (req, res) => {
    try {
        const { nombre, autor, contenido } = req.body;

        if (!nombre || !autor || !contenido) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const db = await connectToDatabaseWrapper();
        const shadersCollection = db.collection('shaders');

        const result = await shadersCollection.updateOne(
            { nombre: nombre },
            { $set: { nombre, autor, contenido } },
            { upsert: true }
        );

        res.status(201).json({ message: 'Shader guardado exitosamente', id: result.upsertedId || result.matchedCount });
    } catch (error) {
        console.error('Error al guardar el shader:', error);
        res.status(500).json({ error: 'Error al guardar el shader' });
    }
});

app.post('/shader/api/save-image', async (req, res) => {
    const { image, name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Falta el nombre del shader' });
    }

    if (!image || !image.startsWith('data:image/png;base64,')) {
        return res.status(400).json({ error: 'Formato de imagen inválido' });
    }

    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    const filePath = path.join(__dirname, 'public', 'img', 'previews', `${name}.png`);

    try {
        // Verificar que el shader existe en la base de datos
        const db = await connectToDatabaseWrapper();
        const shadersCollection = db.collection('shaders');
        const shader = await shadersCollection.findOne({ nombre: name });

        if (!shader) {
            return res.status(404).json({ error: 'Shader no encontrado' });
        }

        // Asegurar que el directorio existe
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Guardar la imagen
        fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });

        // Actualizar la referencia en la base de datos
        await shadersCollection.updateOne(
            { nombre: name },
            { $set: { imagePath: `/img/previews/${name}.png` } }
        );

        res.status(200).json({ 
            message: 'Imagen guardada exitosamente',
            path: `/img/previews/${name}.png`
        });
    } catch (error) {
        console.error('Error al guardar la imagen:', error);
        res.status(500).json({ error: 'Error al guardar la imagen' });
    }
});

app.post('/shader/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        const db = await connectToDatabaseWrapper();
        const usersCollection = db.collection('users');

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            username,
            email,
            password: hashedPassword,
            registerDate: new Date().toISOString(),
            promptsRemaining: 10  // Asignar 10 prompts por defecto
        };
        
        console.log('Registrando nuevo usuario:', JSON.stringify(userData, null, 2));
        await usersCollection.insertOne(userData);

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});

app.get('/shader/api/users', async (req, res) => {
    try {
        console.log('1. Iniciando endpoint /api/users');
        const db = await connectToDatabaseWrapper();
        console.log('2. Base de datos:', db.databaseName);
        
        const usersCollection = db.collection('users');
        
        // Primero obtener todos los usuarios SIN proyección
        const allUsers = await usersCollection.find({}).toArray();
        console.log('3. DATOS COMPLETOS del primer usuario:', JSON.stringify(allUsers[0], null, 2));
        console.log('4. Campos disponibles:', Object.keys(allUsers[0]));
        
        // Ahora sí, obtener los usuarios con la proyección
        const users = await usersCollection.find({}).project({
            username: 1,
            registerDate: 1,
            promptsRemaining: 1,
            _id: 0
        }).toArray();
        
        console.log('5. DATOS PROYECTADOS del primer usuario:', JSON.stringify(users[0], null, 2));
        console.log('6. Total usuarios:', users.length);
        
        res.json(users);
    } catch (error) {
        console.error('Error en /api/users:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

app.get('/shader/api/user', async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    try {
        const db = await connectToDatabaseWrapper();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ _id: userId }, { projection: { password: 0 } });

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error al obtener el usuario:', error);
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
});

app.post('/shader/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        const db = await connectToDatabaseWrapper();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        res.status(200).json({ message: 'Inicio de sesión exitoso' });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

app.get('/shader/api/user-profile', async (req, res) => {
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
            description: user.description || '',
            promptsRemaining: user.promptsRemaining || 0
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error al obtener el perfil' });
    }
});

app.post('/shader/api/update-profile', async (req, res) => {
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

app.post('/shader/api/create-shader', async (req, res) => {
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

app.get('/shader/api/user-shaders/:username', async (req, res) => {
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

app.get('/shader/api/users', async (req, res) => {
    try {
        const db = await connectToDatabaseWrapper();
        const usersCollection = db.collection('users');
        const users = await usersCollection.find({}, { 
            projection: { 
                username: 1, 
                registerDate: 1,
                _id: 0 
            } 
        }).toArray();
        
        console.log('Endpoint /shader/api/users llamado');
        console.log('Usuarios encontrados:', users.length);
        
        // Asegurarse de que todos los usuarios tengan una fecha de registro
        const usersWithDates = users.map(user => ({
            ...user,
            registerDate: user.registerDate || new Date()
        }));
        
        res.json(usersWithDates);
    } catch (error) {
        console.error('Error en /shader/api/users:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

app.delete('/shader/api/shaders/:nombre', async (req, res) => {
    try {
        const db = await connectToDatabaseWrapper();
        const shadersCollection = db.collection('shaders');
        const shaderName = req.params.nombre;

        // Primero verificamos si el shader existe
        const shader = await shadersCollection.findOne({ nombre: shaderName });
        if (!shader) {
            return res.status(404).json({ error: 'Shader no encontrado' });
        }

        // Eliminamos el shader de la base de datos
        await shadersCollection.deleteOne({ nombre: shaderName });

        // Intentamos eliminar la imagen preview si existe
        const previewPath = path.join(__dirname, 'public', 'img', 'previews', `${shaderName}.png`);
        try {
            if (fs.existsSync(previewPath)) {
                fs.unlinkSync(previewPath);
            }
        } catch (error) {
            console.error('Error al eliminar la imagen preview:', error);
            // No retornamos error aquí porque el shader ya fue eliminado
        }

        res.json({ message: 'Shader eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el shader:', error);
        res.status(500).json({ error: 'Error al eliminar el shader' });
    }
});

app.get('/shader/api/connections', (req, res) => {
    try {
        const connections = Array.from(activeConnections.entries()).map(([id, conn]) => ({
            id,
            ...conn,
            shader: activeShaders.get(id)
        }));
        res.json(connections);
    } catch (error) {
        console.error('Error al obtener conexiones:', error);
        res.status(500).json({ error: 'Error al obtener conexiones' });
    }
});

// Configuración de Socket.IO
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    // Registrar nueva conexión
    activeConnections.set(socket.id, {
        id: socket.id,
        connectTime: new Date()
    });

    // Cuando un cliente pide un shader
    socket.on('pedirShader', () => {
        const shaderName = socket.handshake.query.shader || 'default';
        
        // Verificar si hay una sesión activa para este shader
        const activeSession = activeShaders.get(shaderName);
        
        if (activeSession && activeSession.socketId !== socket.id) {
            // Hay una sesión activa, pedirle que envíe su versión
            console.log(`Solicitando shader ${shaderName} al cliente ${activeSession.socketId}`);
            io.to(activeSession.socketId).emit('enviarShaderActual', {
                requestingClient: socket.id
            });
        } else {
            // No hay sesión activa o es el mismo cliente
            activeShaders.set(shaderName, {
                socketId: socket.id,
                lastUpdate: new Date()
            });
        }
        
    });

    // Cuando un cliente envía una actualización
    socket.on('shaderUpdate', (data) => {
        const { nombre, autor, contenido, cursorPos } = data;
        
        // Actualizar registro de shader activo
        activeShaders.set(nombre, {
            socketId: socket.id,
            lastUpdate: new Date()
        });

        // Broadcast solo a los clientes que no sean el emisor
        socket.broadcast.emit('shaderUpdate', {
            ...data,
            socketId: socket.id  // Incluir el ID del socket emisor
        });
    });

    // Cuando un cliente envía una actualización de uniformes
    socket.on('uniformsUpdate', (data) => {
        console.log('Uniform update received from:', socket.id);
        // Solo enviar a los clientes que no sean el emisor
        socket.broadcast.emit('uniformsUpdate', {
            ...data,
            socketId: socket.id
        });
    });

    // Cuando un cliente se desconecta
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        activeConnections.delete(socket.id);
        
        // Limpiar shaders activos de este cliente
        for (const [shaderName, session] of activeShaders.entries()) {
            if (session.socketId === socket.id) {
                activeShaders.delete(shaderName);
            }
        }
    });
});

// Función para iniciar el servidor
async function startServer() {
    try {
        // Conectar a la base de datos
        await connectToDatabaseWrapper();
        
        // Validar las claves de API
        validateApiKeys();
        
        // Iniciar el servidor HTTP
        http.listen(PORT, () => {
            console.log(`Servidor escuchando en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
    }
}

startServer();
