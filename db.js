const { Pool } = require('pg');
require('dotenv').config(); // Carga las variables de entorno

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
});

module.exports = pool;

//https://console.neon.tech/app/projects