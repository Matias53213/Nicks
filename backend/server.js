const express = require('express');
const cors = require('cors');
const db = require('./db/queries');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoints
app.post('/api/nicks', async (req, res) => {
  try {
    const nick = await db.addNick(req.body.name);
    
    // Buscar nicks similares
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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});