require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db/queries');
const fs = require('fs');

// ===========================================
// 1. CONFIGURACIÓN INICIAL
// ===========================================
const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===========================================
// 2. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS (PUBLIC)
// ===========================================
const PUBLIC_PATH = path.join(__dirname, '../public');

// Verificación de carpeta public/
if (!fs.existsSync(PUBLIC_PATH)) {
  console.error('❌ ERROR CRÍTICO: No se encuentra la carpeta public/ en:', PUBLIC_PATH);
  process.exit(1);
}

app.use(express.static(PUBLIC_PATH));

// ===========================================
// 3. RUTAS DEL FRONTEND
// ===========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_PATH, 'index.html'), (err) => {
    if (err) res.status(500).send('Error al cargar la página principal');
  });
});

app.get('/show-nicks', (req, res) => {
  res.sendFile(path.join(PUBLIC_PATH, 'show-nicks.html'), (err) => {
    if (err) res.status(500).send('Error al cargar nicks');
  });
});

// ===========================================
// 4. ENDPOINTS DE LA API (COMPLETOS)
// ===========================================
// 4.1 Guardar nick
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

// 4.2 Obtener nick aleatorio
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

// 4.3 Reiniciar nicks mostrados
app.post('/api/nicks/reset', async (req, res) => {
  try {
    await db.resetShownNicks();
    const count = await db.getNicksCount();
    res.json({ success: true, count });
  } catch (err) {
    handleError(res, err);
  }
});

// 4.4 Contador de nicks
app.get('/api/nicks/count', async (req, res) => {
  try {
    const count = await db.getNicksCount();
    res.json({ success: true, count });
  } catch (err) {
    handleError(res, err);
  }
});

// ===========================================
// 5. MANEJO DE ERRORES
// ===========================================
function handleError(res, err) {
  console.error('⚠️ Error:', err);
  const status = err.message === 'El nick ya existe' ? 400 : 500;
  res.status(status).json({ 
    success: false, 
    error: err.message || 'Error interno' 
  });
}

// Ruta 404 (para cualquier otra ruta no definida)
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_PATH, '404.html'));
});

// ===========================================
// 6. INICIAR SERVIDOR (CONFIGURACIÓN RENDER)
// ===========================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
==================================
🚀 Servidor activo en puerto ${PORT}
🔗 URLS:
- Frontend: http://localhost:${PORT}
- API Docs: http://localhost:${PORT}/api-docs
==================================`);
});

// Manejo de errores del servidor
server.on('error', (err) => {
  console.error('💥 ERROR AL INICIAR:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('⚠️ Unhandled Rejection:', err);
});
