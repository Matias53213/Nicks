const Pool = require('pg').Pool;
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

// Crear tabla si no existe
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nicks (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      shown BOOLEAN DEFAULT FALSE
    );
  `);
};

initDB();

module.exports = {
  async addNick(name) {
    try {
      const result = await pool.query(
        'INSERT INTO nicks (name) VALUES ($1) RETURNING *',
        [name]
      );
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') { // Código de error de duplicado en PostgreSQL
        throw new Error('El nick ya existe');
      }
      throw err;
    }
  },
async findSimilarNicks(name) {
  const result = await pool.query(
    `SELECT name FROM nicks 
     WHERE LOWER(name) LIKE LOWER('%' || $1 || '%')
     AND name != $1
     LIMIT 5`,
    [name]
  );
  return result.rows;
},

  async getRandomUnshownNick() {
    const result = await pool.query(
      `UPDATE nicks 
       SET shown = TRUE 
       WHERE id = (
         SELECT id FROM nicks 
         WHERE shown = FALSE 
         ORDER BY RANDOM() 
         LIMIT 1
       ) 
       RETURNING name`
    );
    return result.rows[0]?.name;
  },

  async resetShownNicks() {
    await pool.query('UPDATE nicks SET shown = FALSE');
  },

  async getNicksCount() {
    const total = await pool.query('SELECT COUNT(*) FROM nicks');
    const unshown = await pool.query('SELECT COUNT(*) FROM nicks WHERE shown = FALSE');
    return {
      total: parseInt(total.rows[0].count),
      unshown: parseInt(unshown.rows[0].count)
    };
  }
};