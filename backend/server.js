require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/queries');

// Configuración del servidor
const app = express();
const PORT = process.env.PORT || 10000; // Render usa 10000

// Middlewares (igual que en tu versión local)
app.use(cors());
app.use(express.json());

// ===========================================
// 🔄 MISMOS ENDPOINTS QUE EN TU VERSIÓN LOCAL
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
    if (err.message === 'El nick ya existe') {
      return res.status(400).json({ 
        success: false, 
        error: 'El nick ya existe en la base de datos' 
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/nicks/random', async (req, res) => {
  try {
    const nick = await db.getRandomUnshownNick();
    const count = await db.getNicksCount();
    
    if (!nick) {
      return res.status(404).json({ 
        success: false, 
        error: 'No hay más nicks para mostrar' 
      });
    }
    
    res.json({ success: true, nick, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/nicks/reset', async (req, res) => {
  try {
    await db.resetShownNicks();
    const count = await db.getNicksCount();
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/nicks/count', async (req, res) => {
  try {
    const count = await db.getNicksCount();
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===========================================
// 🆕 ADAPTACIONES PARA RENDER.COM
// ===========================================
// 1. Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../public')));

// 2. Rutas para el frontend (evitar "Cannot GET /")
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/show-nicks', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/show-nicks.html'));
});

// 3. Configuración especial para PostgreSQL en Render
const pool = new (require('pg').Pool)({
  connectionString: process.env.DATABASE_URL || {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  }
});

// 4. Iniciar servidor (configuración para producción)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
==================================
✅ Servidor funcionando en puerto ${PORT}
🔗 URLs:
- API: http://localhost:${PORT}/api/nicks
- Frontend: http://localhost:${PORT}
==================================`);
});
