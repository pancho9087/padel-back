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

module.exports = router;