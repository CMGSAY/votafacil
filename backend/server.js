// backend/server.js
const app = require('./src/app');
require('dotenv').config();

// Puerto dinámico para producción (Render) y valor por defecto local (3000)
// NOTA: Render asigna automaticamente el puerto a traves de process.env.PORT.
// No se debe cambiar de forma hardcodeada para asegurar la compatibilidad en la nube.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor de VotaFacil corriendo en el puerto ${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});
