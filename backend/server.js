require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db/queries');
const fs = require('fs'); // Para verificar archivos

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares esenciales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===========================================
// 🔥 CONFIGURACIÓN CLAVE PARA RENDER.COM
// ===========================================
const PUBLIC_PATH = path.join(__dirname, '../public'); // Ruta ABSOLUTA a /public

// Verificar si la carpeta "public" existe (evita errores ENOENT)
if (!fs.existsSync(PUBLIC_PATH)) {
  console.error('❌ ERROR: No se encuentra la carpeta "public/" en:', PUBLIC_PATH);
  process.exit(1); // Detiene el servidor si no existe
}

// Servir archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(PUBLIC_PATH));

// ===========================================
// 🚀 RUTAS DEL FRONTEND (para evitar "Cannot GET /")
// ===========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_PATH, 'index.html'), (err) => {
    if (err) {
      console.error('Error al cargar index.html:', err);
      res.status(500).send('Error al cargar la página principal');
    }
  });
});

app.get('/show-nicks', (req, res) => {
  res.sendFile(path.join(PUBLIC_PATH, 'show-nicks.html'), (err) => {
    if (err) {
      console.error('Error al cargar show-nicks.html:', err);
      res.status(500).send('Error al cargar la página de nicks');
    }
  });
});

// ===========================================
// 📡 ENDPOINTS DE LA API (tus rutas existentes)
// ===========================================
app.post('/api/nicks', async (req, res) => {
  try {
    const nick = await db.addNick(req.body.name);
    const similarNicks = await db.findSimilarNicks(req.body.name);
    
    res.json({
      success: true,
      nick,
      similarNicks: similarNicks.length > 0 ? similarNicks : null
    });
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/nicks/random', async (req, res) => {
  try {
    const result = await db.getRandomUnshownNick();
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        error: 'No hay más nicks para mostrar' 
      });
    }
    
    const count = await db.getNicksCount();
    res.json({
      success: true,
      nick: result.nick,
      similarNicks: result.similar.length > 0 ? result.similar : null,
      count
    });
  } catch (err) {
    handleError(res, err);
  }
});

// ... (Mantén tus otros endpoints aquí: reset, count, etc.)

// ===========================================
// 🛑 MANEJO DE ERRORES (evita crashes en producción)
// ===========================================
function handleError(res, err) {
  console.error('⚠️ Error en la API:', err);
  const status = err.message === 'El nick ya existe' ? 400 : 500;
  res.status(status).json({ 
    success: false, 
    error: err.message || 'Error interno del servidor'
  });
}

// Ruta para 404 (si alguien accede a una ruta inexistente)
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_PATH, '404.html'));
});

// ===========================================
// ⚡ INICIAR SERVIDOR (configuración para Render.com)
// ===========================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n==================================');
  console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
  console.log(`📂 Sirviendo archivos desde: ${PUBLIC_PATH}`);
  console.log('==================================\n');
});

// Capturar errores del servidor
server.on('error', (err) => {
  console.error('💥 ERROR CRÍTICO:', err);
  process.exit(1); // Reinicia el servidor si hay un error fatal
});

// Capturar promesas no manejadas
process.on('unhandledRejection', (err) => {
  console.error('⚠️ Unhandled Rejection:', err);
});
