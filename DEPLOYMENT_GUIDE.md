# 🚀 Guía de Despliegue — VotaFácil
### De local a producción: Render (backend + BD) + Vercel (frontend)

---

## 📋 Resumen del proceso

```
Tu computadora → GitHub → Render (backend + BD) → Vercel (frontend)
```

| Parte | Dónde se despliega | Gratis |
|---|---|---|
| **Base de datos MySQL** | Render | ✅ |
| **Backend (Node.js/Express)** | Render | ✅ |
| **Frontend (HTML/CSS/JS)** | Vercel | ✅ |

---

## PARTE 1 — Preparar el código antes de subir

Antes de subir a GitHub hay que hacer **2 cambios clave en el código**.

---

### 🔧 Cambio 1: Actualizar `frontend/assets/js/api.js`

Este archivo tiene la URL del backend hardcodeada como `localhost`.
Hay que cambiarla para que detecte automáticamente si está en local o en producción.

**Abre el archivo:** `frontend/assets/js/api.js`

**Busca esta línea (línea 7):**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**Cámbiala por esto:**
```javascript
// Detecta automáticamente si estás en local o en producción
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : 'https://TU-BACKEND.onrender.com/api';
```

> ⚠️ **IMPORTANTE:** El texto `TU-BACKEND` lo obtienes cuando crees el servicio
> en Render (Parte 4). Por ahora déjalo así y vuelve a actualizarlo antes de
> subir el frontend a Vercel.

---

### 🔧 Cambio 2: Verificar el `.gitignore`

El `.env` con tus contraseñas NO debe subirse a GitHub.
Verifica que el `.gitignore` tenga estas líneas:

```
.env
node_modules/
```

✅ Tu proyecto ya lo tiene configurado. No necesitas cambiarlo.

---

## PARTE 2 — Subir el proyecto a GitHub

### Paso 2.1 — Crear una cuenta en GitHub
1. Ve a https://github.com y crea una cuenta.
2. Confirma tu correo electrónico.

### Paso 2.2 — Instalar Git
1. Descarga Git desde https://git-scm.com/downloads (Windows)
2. Instálalo con opciones por defecto.
3. Verifica abriendo PowerShell:
   ```
   git --version
   ```

### Paso 2.3 — Configurar Git
```
git config --global user.name "Tu Nombre"
git config --global user.email "tu@correo.com"
```

### Paso 2.4 — Crear repositorio en GitHub
1. En GitHub → botón **"New"** (ícono +).
2. Nombre: `votafacil` | Visibilidad: Public
3. ❌ NO marques "Add a README file"
4. Clic en **"Create repository"**.

### Paso 2.5 — Subir el código a GitHub

Ejecuta estos comandos uno por uno en PowerShell:

```
cd C:\Users\carlo\Desktop\votafacil
git init
git add .
git commit -m "Version inicial de VotaFacil"
git remote add origin https://github.com/TU_USUARIO/votafacil.git
git branch -M main
git push -u origin main
```

*(Reemplaza `TU_USUARIO` por tu nombre de usuario en GitHub)*

✅ ¡Tu código ya está en GitHub!

---

## PARTE 3 — Crear la Base de Datos MySQL en Render

### Paso 3.1 — Crear cuenta en Render
1. Ve a https://render.com
2. Clic en **"Get Started for Free"**
3. Regístrate con tu cuenta de GitHub.

### Paso 3.2 — Crear la base de datos MySQL
1. En el panel, clic en **"New +"** → **"MySQL"**
2. Configuración:
   - Name: `votafacil-db`
   - Database: `votadb`
   - Region: Oregon (US West)
   - Plan: **Free**
3. Clic en **"Create Database"**.
4. Espera 2-3 minutos hasta que el estado sea **"Available"** (verde).

### Paso 3.3 — Guardar las credenciales de la BD
En la sección **"Connections"** de tu BD en Render, copia y guarda:
```
Hostname:  dpg-xxxxxxxxxx.oregon-mysql.render.com
Port:      3306
Database:  votadb
Username:  votadb_user
Password:  xxxxxxxxxxxxxxxxxxx
```

### Paso 3.4 — Importar las tablas

**Con TablePlus (recomendado):**
1. Descarga TablePlus gratis: https://tableplus.com
2. Crea conexión MySQL con las credenciales de Render.
3. Menú **File → Import → From SQL File...**
4. Selecciona el archivo `votadb.sql` de tu proyecto y ejecútalo.

**Con la Shell de Render:**
En la pestaña **"Shell"** de tu BD en Render, copia y pega todo el contenido
del archivo `votadb.sql` y presiona Enter.

### Paso 3.5 — Crear el usuario administrador

Ejecuta esta consulta SQL en TablePlus o la Shell de Render:

```sql
DELETE FROM usuarios WHERE correo = 'admin@votafacil.com';

INSERT INTO usuarios (nombre_usuario, correo, clave_hash, rol)
VALUES (
    'admin',
    'admin@votafacil.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'administrador'
);
```

Esto crea el admin con contraseña: **admin123**
(puedes cambiarla después desde la aplicación)

---

## PARTE 4 — Desplegar el Backend en Render

### Paso 4.1 — Crear el Web Service
1. Clic en **"New +"** → **"Web Service"**.
2. **"Connect a repository"** → selecciona `votafacil`.
3. Configuración:

   | Campo | Valor |
   |---|---|
   | Name | `votafacil-backend` |
   | Root Directory | `backend` |
   | Environment | `Node` |
   | Build Command | `npm install` |
   | Start Command | `node server.js` |
   | Plan | Free |

### Paso 4.2 — Variables de entorno en Render

En la sección **"Environment Variables"**, agrega estas variables:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DB_HOST` | El Hostname de tu BD (de Render) |
| `DB_PORT` | `3306` |
| `DB_USER` | El Username de tu BD (de Render) |
| `DB_PASSWORD` | El Password de tu BD (de Render) |
| `DB_NAME` | `votadb` |
| `JWT_SECRET` | Clave larga y segura (mínimo 32 caracteres) |
| `JWT_EXPIRES_IN` | `24h` |
| `FRONTEND_URL` | Lo agregas después con la URL de Vercel |

**Para generar un JWT_SECRET seguro:**
👉 https://generate-secret.vercel.app/32

### Paso 4.3 — Desplegar

1. Clic en **"Create Web Service"**.
2. Espera 3-5 minutos viendo los logs.
3. Cuando aparezca:
   ```
   Servidor de VotaFacil corriendo en el puerto 10000
   Conexion exitosa con la base de datos MySQL.
   ```
   ¡El backend está activo!

### Paso 4.4 — Anotar la URL del backend

Copia la URL que aparece en la parte superior, ejemplo:
```
https://votafacil-backend.onrender.com
```
**Guárdala. La necesitarás para los siguientes pasos.**

### Paso 4.5 — Verificar el backend

Abre en el navegador:
```
https://votafacil-backend.onrender.com/
```

Debes ver:
```json
{"success": true, "message": "Servidor base de VotaFacil funcionando correctamente"}
```

✅ ¡Backend en línea!

---

## PARTE 5 — Actualizar el Frontend con la URL del Backend

Abre `frontend/assets/js/api.js` y actualiza la línea que cambiaste en la Parte 1:

**Cambia:**
```javascript
    : 'https://TU-BACKEND.onrender.com/api';
```

**Por la URL real de tu backend:**
```javascript
    : 'https://votafacil-backend.onrender.com/api';
```

Guarda el archivo y sube los cambios a GitHub:
```
git add .
git commit -m "Conectar frontend con backend de Render"
git push
```

---

## PARTE 6 — Desplegar el Frontend en Vercel

### Paso 6.1 — Crear cuenta en Vercel
1. Ve a https://vercel.com
2. Clic en **"Start Deploying"**
3. Regístrate con tu cuenta de GitHub.

### Paso 6.2 — Crear el proyecto
1. Clic en **"Add New..."** → **"Project"**.
2. Busca e importa el repositorio `votafacil`.
3. Configuración:

   | Campo | Valor |
   |---|---|
   | Project Name | `votafacil` |
   | Framework Preset | `Other` |
   | Root Directory | `frontend` |
   | Build Command | *(dejar vacío)* |
   | Output Directory | *(dejar vacío)* |

4. Clic en **"Deploy"**.

### Paso 6.3 — Obtener la URL del Frontend

Después de ~60 segundos, Vercel te dará una URL como:
```
https://votafacil.vercel.app
```

### Paso 6.4 — Probar la aplicación

Abre `https://votafacil.vercel.app` en el navegador.
Inicia sesión con:
- **Correo:** admin@votafacil.com
- **Contraseña:** admin123

---

## PARTE 7 — Último ajuste: Actualizar CORS en el Backend

Para que el backend acepte peticiones del frontend en Vercel:

1. Ve al panel de `votafacil-backend` en Render.
2. Clic en **"Environment"** (menú izquierdo).
3. Busca la variable `FRONTEND_URL` y cámbiala por:
   ```
   https://votafacil.vercel.app
   ```
4. Clic en **"Save Changes"**.
5. Render reinicia el backend automáticamente (~1 minuto).

✅ **¡La aplicación está completamente en línea!**

---

## 🔄 Cómo actualizar el proyecto en el futuro

Cada vez que hagas cambios:
```
git add .
git commit -m "Descripción del cambio"
git push
```

- **Render** actualiza el backend automáticamente.
- **Vercel** actualiza el frontend automáticamente.

---

## ❗ Problemas comunes y soluciones

| Problema | Solución |
|---|---|
| Backend tarda ~30s en responder | Normal. Render duerme el servicio gratuito tras 15 min de inactividad. |
| Error de CORS al hacer login | Verifica que `FRONTEND_URL` en Render sea exactamente la URL de Vercel (sin barra al final). |
| La BD no conecta | Copia exactamente Hostname, User y Password desde el panel de la BD en Render. |
| Login dice "contraseña incorrecta" | Ejecuta el SQL del Paso 3.5 para reinsertar el admin con hash correcto. |
| Frontend carga pero no muestra datos | Verifica que `api.js` tenga la URL correcta de Render en producción. |
| Error 404 en páginas del frontend | Asegúrate de que el Root Directory en Vercel sea `frontend`. |

---

## 📁 Resumen de cambios en el código

Solo debes modificar **UN archivo**:

| Archivo | Qué cambiar |
|---|---|
| `frontend/assets/js/api.js` línea 7 | Reemplazar la URL de localhost por la detección automática con la URL de Render |

Todo lo demás (credenciales, variables de entorno) se configura en
los paneles de Render y Vercel — sin tocar más código.
