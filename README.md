<<<<<<< HEAD
# VotaFácil - Plataforma Web de Votaciones Modernas

VotaFácil es una aplicación web Full Stack (desacoplada) que permite a cualquier usuario registrado crear salas públicas o privadas, configurar votaciones con múltiples tipos de respuestas (selección única, múltiple, Sí/No, escala de calificación) y ver resultados en tiempo real o diferidos, todo con una interfaz moderna y segura.

---

## Estructura del Proyecto

```text
votafacil/
├── backend/             # Código del servidor (Node.js + Express + MySQL)
│   ├── src/
│   │   ├── config/      # Conexión a la base de datos y seeds
│   │   ├── controllers/ # Lógica de los endpoints
│   │   ├── middlewares/ # Autenticación, validación y errores
│   │   ├── routes/      # Enrutamiento de la API REST
│   │   └── app.js       # Configuración inicial de Express
│   ├── .env             # Variables de entorno locales
│   ├── .env.example     # Plantilla de variables de entorno
│   ├── package.json     # Scripts y dependencias
│   └── server.js        # Entrada del servidor
├── frontend/            # Cliente estático (HTML5 + CSS3 + JS Vanilla)
│   ├── assets/
│   │   ├── css/         # Estilos globales (global.css con variables)
│   │   └── js/          # Scripts controladores y api.js
│   ├── pages/           # Vistas de la aplicación
│   └── index.html       # Landing page inicial
├── votadb.sql           # Script de creación de base de datos MySQL
└── README.md            # Guía del proyecto
```

---

## Configuración y Ejecución en Local

### Requisitos Previos

- Node.js (versión 18 o superior)
- Servidor MySQL 8.0+ activo

### 1. Base de Datos
- Asegúrate de tener MySQL corriendo en `localhost:3306`.
- El puerto por defecto es el normal (`3306`).
- La contraseña configurada por defecto en el desarrollo es: `1234`.
- Ejecuta las sentencias del archivo `votadb.sql` en tu gestor de base de datos MySQL para crear la base de datos `votadb` y sus tablas.

### 2. Configurar el Backend
1. Abre una terminal en la carpeta `backend/`.
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Configura el archivo `.env` en la raíz de `backend/` con las siguientes variables locales:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=1234
   DB_NAME=votadb
   JWT_SECRET=clave_secreta_para_votafacil_desarrollo_local_12345
   JWT_EXPIRES_IN=24h
   FRONTEND_URL=http://localhost:5500
   ```
4. Poblar la base de datos con datos de prueba (seeds):
   ```bash
   node src/config/seed.js
   ```
   Esto creará un usuario de prueba (`juan@votafacil.com` con contraseña `password123`) y un par de salas de ejemplo.
5. Iniciar el servidor de desarrollo del backend:
   ```bash
   npm run dev
   ```
   El backend estará escuchando en `http://localhost:3000`.

### 3. Configurar el Frontend
Para levantar el frontend localmente en el puerto `5500`:
1. Puedes usar cualquier servidor web estático (como la extensión Live Server de VS Code o `npx serve`).
2. Si prefieres usar la terminal, en la raíz del proyecto ejecuta:
   ```bash
   npx serve -l 5500 frontend
   ```
3. Abre tu navegador e ingresa a `http://localhost:5500`.

---

## Preparación y Guía de Despliegue en Producción (Vercel y Render)

El código ha sido estructurado desde el primer momento con comentarios específicos para facilitar la migración automática a producción sin alterar la lógica de negocio.

### Paso 1: Base de Datos MySQL Remota
1. Contrata o crea una base de datos MySQL gestionada en la nube (por ejemplo, en PlanetScale, Aiven o Clever Cloud).
2. Ejecuta el archivo `votadb.sql` en ese servidor remoto para aprovisionar el esquema de tablas.
3. Guarda la cadena de conexión (Host, Puerto, Usuario, Contraseña y Nombre de la Base de Datos).

### Paso 2: Despliegue del Backend en Render
1. Sube tu repositorio de GitHub.
2. Inicia sesión en Render y crea un nuevo **Web Service**.
3. Conecta el repositorio de GitHub y selecciona el directorio raíz de la aplicación backend configurando:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. En la sección de variables de entorno de Render (**Environment Variables**), agrega las siguientes claves basadas en tu base de datos remota:
   - `PORT`: (Render lo asignará de forma automática)
   - `DB_HOST`: Host de tu base de datos MySQL remota
   - `DB_PORT`: Puerto de tu base de datos remota (por ejemplo, 3306)
   - `DB_USER`: Usuario remoto
   - `DB_PASSWORD`: Contraseña remota
   - `DB_NAME`: Nombre de la base de datos remota
   - `JWT_SECRET`: Una clave segura de producción de 256 bits generada al azar
   - `JWT_EXPIRES_IN`: 7d (o el tiempo que estimes conveniente)
   - `FRONTEND_URL`: El dominio final que te asigne Vercel para el frontend (ej. `https://votafacil.vercel.app`)

### Paso 3: Despliegue del Frontend en Vercel
1. Ve al archivo `frontend/assets/js/api.js` y localiza la variable `API_BASE_URL`.
2. Modifica el valor de esa constante para que apunte al dominio HTTPS seguro provisto por Render en el paso anterior:
   ```javascript
   // Cambiar de:
   // const API_BASE_URL = 'http://localhost:3000/api';
   // A:
   const API_BASE_URL = 'https://tu-backend-votafacil.onrender.com/api';
   ```
3. Sube los cambios a GitHub.
4. Entra a Vercel, crea un nuevo proyecto, asocia el repositorio de GitHub y selecciona la carpeta `frontend/` para el despliegue.
5. Vercel detectará el archivo `index.html` en la raíz del frontend y desplegará de forma automática el sitio estático.
=======
# votafacil
Pagina web para votar por cosas importantes o solo para ponernos deacuerdo sobre algo
>>>>>>> 0ff7f54272f341c00823fcb6e90b5df42c5bf42a
