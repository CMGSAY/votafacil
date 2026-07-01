// backend/src/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear un pool de conexiones a la base de datos
// NOTA: Para produccion (despliegue en Render/MySQL remoto), los valores se obtendran
// de las variables de entorno configuradas en Render. No modifiques las credenciales
// directamente en este archivo por razones de seguridad.
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'votadb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Funcion para verificar la conexion con la base de datos
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Conexion exitosa con la base de datos MySQL.');
        connection.release();
        return true;
    } catch (error) {
        console.error('Error al conectar con la base de datos MySQL:', error.message);
        return false;
    }
}

// Ejecutar prueba de conexion al iniciar
testConnection();

module.exports = pool;
