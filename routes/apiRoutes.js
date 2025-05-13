const express = require('express');
const router = express.Router();
const pool = require('../db'); // Importa la conexión a la base de datos



// Ruta de prueba para verificar la conexión
router.get('/test', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users;');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        res.status(500).json({ success: false, error: 'Error al conectar con la base de datos' });
    }
});

// Otra ruta de ejemplo
router.get('/another', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM another_table;');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
        res.status(500).json({ success: false, error: 'Error al conectar con la base de datos' });
    }
});


router.post('/api/reservations/batch', async (req, res) => {
  const client = await pool.connect();
  try {
    // Validación básica
    if (!Array.isArray(req.body.reservations)) {
      return res.status(400).json({ error: 'Formato de datos inválido' });
    }

    await client.query('BEGIN');
    
    const inserted = [];
    const errors = [];
    
    for (const [index, resv] of req.body.reservations.entries()) {
      try {
        // Validación de campos requeridos
        if (!resv.date || !resv.start_time || !resv.end_time || !resv.court_id || !resv.client_id) {
          errors.push({ index, error: 'Campos requeridos faltantes' });
          continue;
        }

        const result = await client.query(
          `INSERT INTO reservations 
          (date, start_time, end_time, court_id, client_id) 
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, date, start_time, end_time, court_id`,
          [resv.date, resv.start_time, resv.end_time, resv.court_id, resv.client_id]
        );
        inserted.push(result.rows[0]);
      } catch (err) {
        errors.push({ 
          index,
          error: err.constraint === 'no_overlap_reservation' 
            ? 'Conflicto de horario' 
            : err.message
        });
      }
    }
    
    await client.query('COMMIT');
    
    if (errors.length > 0) {
      res.status(207).json({ // 207 Multi-Status
        success: true,
        inserted,
        errors,
        message: 'Algunas reservas no se pudieron procesar'
      });
    } else {
      res.status(201).json({
        success: true,
        inserted,
        message: 'Todas las reservas fueron creadas'
      });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  } finally {
    client.release();
  }
});

// Disponibilidad
router.get('/api/reservations/availability', async (req, res) => {
  try {
    const { date, court_id, start, end } = req.query;
    
    const result = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM reservations 
        WHERE date = $1 
        AND court_id = $2
        AND (
          (start_time <= $3 AND end_time > $3) OR
          (start_time < $4 AND end_time >= $4) OR
          (start_time >= $3 AND end_time <= $4)
        )
      ) AS is_booked`,
      [date, court_id, start, end]
    );
    
    res.json({ available: !result.rows[0].is_booked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener reservas por rango de fechas
router.get('/api/reservations', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const result = await pool.query(
      `SELECT r.*, c.name AS client_name, ct.name AS court_name
       FROM reservations r
       LEFT JOIN clients c ON r.client_id = c.id
       JOIN courts ct ON r.court_id = ct.id
       WHERE date BETWEEN $1 AND $2
       ORDER BY date, start_time`,
      [start_date, end_date]
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/courts', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM courts WHERE status = $1', ['active']);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;