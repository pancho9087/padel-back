
const express = require('express');
require('dotenv').config(); // Carga las variables de entorno
const apiRoutes = require('./routes/apiRoutes'); // Importa las rutas

const app = express();
const port = process.env.PORT || 3000; // Usa el puerto desde las variables de entorno

// Middleware para parsear JSON
app.use(express.json());

// Usar las rutas
app.use('/api', apiRoutes);

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});