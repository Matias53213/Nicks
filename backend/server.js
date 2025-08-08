require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db/queries');

// Configuración inicial
const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares esenciales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración para producción/desarrollo
const isProduction = process.env.NODE_ENV === 'production';
const staticDir = isProduction 
  ? path.join(__dirname, '../public') 
  : path.join(__dirname, '../frontend');

// Servir archivos estáticos
app.use(express.static(staticDir));

// Rutas del Frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.get('/show-nicks', (req, res) => {
  res.sendFile(path.join(staticDir, 'show-nicks.html'));
});

// API Endpoints
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

app.post('/api/nicks/reset', async (req, res) => {
  try {
    await db.resetShownNicks();
    const count = await db.getNicksCount();
    res.json({ success: true, count });
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/api/nicks/count', async (req, res) => {
  try {
    const count = await db.getNicksCount();
    res.json({ success: true, count });
  } catch (err) {
    handleError(res, err);
  }
});

// Manejo de errores centralizado
function handleError(res, err) {
  console.error(err);
  if (err.message === 'El nick ya existe') {
    return res.status(400).json({ 
      success: false, 
      error: 'El nick ya existe en la base de datos' 
    });
  }
  res.status(500).json({ success: false, error: err.message });
}

// Ruta para 404 (Not Found)
app.use((req, res) => {
  res.status(404).sendFile(path.join(staticDir, '404.html'));
});

// Iniciar servidor con manejo robusto de errores
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`);
  console.log(`📚 API docs en http://localhost:${PORT}/api-docs`);
  console.log(`🎨 Frontend en http://localhost:${PORT}/`);
});

// Manejo de errores del servidor
server.on('error', (err) => {
  console.error('💥 Error del servidor:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('⚠️ Unhandled Rejection:', err);
});
