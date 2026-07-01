# Sistema Web de Votaciones

## Descripción General

El proyecto consiste en desarrollar una aplicación web de votaciones que permita a cualquier usuario crear, administrar y participar en votaciones de cualquier temática de forma sencilla, rápida y segura.

El sistema estará enfocado en ofrecer una experiencia moderna, intuitiva e interactiva, permitiendo que cualquier persona pueda crear una votación en pocos pasos y compartirla con otros usuarios mediante un enlace o un código de acceso.

La aplicación será desarrollada inicialmente para funcionar en un entorno local, siguiendo una arquitectura profesional que facilite su despliegue futuro en la nube sin necesidad de realizar cambios importantes en el código.

El objetivo no es únicamente desarrollar una página para realizar votaciones, sino construir una aplicación web completa que permita aprender y aplicar buenas prácticas de desarrollo Full Stack.

---

# Objetivos del Proyecto

Desarrollar una plataforma web que permita:

- Crear votaciones de cualquier temática.
- Administrar salas públicas y privadas.
- Permitir la participación de usuarios registrados.
- Configurar diferentes tipos de votación.
- Visualizar resultados de forma clara e interactiva.
- Ofrecer una experiencia de usuario moderna, rápida y fácil de utilizar.
- Implementar una arquitectura escalable para futuras mejoras.
- Aprender el desarrollo completo de aplicaciones web utilizando tecnologías ampliamente utilizadas en la industria.

---

# Alcance del Proyecto

La primera versión del sistema estará enfocada en cubrir las funcionalidades esenciales para el funcionamiento de una plataforma de votaciones.

El sistema permitirá:

- Registro de usuarios.
- Inicio y cierre de sesión.
- Recuperación de contraseña (versión futura).
- Creación de salas de votación.
- Administración de votaciones.
- Participación mediante votos.
- Visualización de resultados.
- Gestión del perfil del usuario.

El proyecto será desarrollado completamente en un entorno local durante la etapa de desarrollo.

Posteriormente se desplegará utilizando servicios en la nube.

---

# Tecnologías del Proyecto

## Frontend

- HTML5
- CSS3
- JavaScript (Vanilla)

El frontend será responsable de:

- Mostrar la interfaz gráfica.
- Validar información básica.
- Consumir la API del backend.
- Mostrar resultados y estadísticas.
- Gestionar la interacción con el usuario.

---

## Backend

- Node.js
- Express.js

El backend será responsable de:

- Exponer la API REST.
- Gestionar usuarios.
- Administrar autenticación.
- Crear salas.
- Administrar votaciones.
- Registrar votos.
- Validar información.
- Aplicar reglas del negocio.
- Conectarse con la base de datos.

---

## Base de Datos

Se utilizará MySQL como sistema gestor de bases de datos.

La elección de una base de datos relacional se debe a que la información del proyecto posee relaciones bien definidas entre usuarios, salas, votaciones, opciones y votos.

Este tipo de estructura facilita:

- Mantener la integridad de los datos.
- Evitar duplicidad de información.
- Realizar consultas complejas.
- Escalar el sistema en futuras versiones.

---

# Arquitectura del Sistema

El proyecto seguirá una arquitectura Cliente - Servidor.

```text
Usuario
    │
    ▼
Frontend
(HTML + CSS + JavaScript)
    │
HTTP / Fetch API
    ▼
Backend
(Node.js + Express)
    │
MySQL
```

El frontend nunca accederá directamente a la base de datos.

Toda la comunicación se realizará mediante una API REST desarrollada en Express.

---

# Desarrollo Local

Durante la etapa de desarrollo todos los servicios funcionarán localmente.

## Frontend

```text
http://localhost:5500
```

## Backend

```text
http://localhost:3000
```

## Base de Datos

```text
localhost:3306
```

---

# Despliegue Futuro

Una vez finalizado el proyecto se realizará el despliegue utilizando diferentes plataformas.

## Frontend

Vercel

## Backend

Render

## Base de Datos

Inicialmente podrá utilizarse MySQL remoto.

Posteriormente podrá migrarse a una solución administrada dependiendo del crecimiento del proyecto.

La arquitectura será la siguiente:

```text
Usuario
      │
      ▼
Frontend (Vercel)
      │
 HTTPS
      ▼
Backend (Render)
      │
      ▼
MySQL
```

El sistema será desarrollado desde el inicio pensando en este tipo de despliegue, evitando dependencias entre el frontend y el backend.

---

# Características del Sistema

El sistema permitirá crear votaciones para cualquier tipo de evento, organización o actividad.

Ejemplos:

- Elecciones escolares.
- Encuestas empresariales.
- Votaciones familiares.
- Decisiones de equipos de trabajo.
- Encuestas de satisfacción.
- Concursos.
- Eventos.
- Comunidades.
- Clubes.
- Organizaciones.

---

# Tipos de Usuarios

## Invitado

Podrá:

- Visualizar la página principal.
- Registrarse.
- Iniciar sesión.

No podrá participar en votaciones sin autenticarse.

---

## Usuario Registrado

Podrá:

- Crear salas.
- Crear votaciones.
- Editar sus votaciones.
- Eliminar sus votaciones.
- Participar en votaciones.
- Consultar resultados.
- Administrar su perfil.

---

## Administrador

En versiones futuras podrá:

- Gestionar usuarios.
- Eliminar contenido.
- Supervisar salas públicas.
- Revisar reportes.
- Consultar estadísticas generales.

---

# Funcionalidades Principales

## Autenticación

El sistema permitirá:

- Registro de usuarios.
- Inicio de sesión.
- Cierre de sesión.
- Protección de rutas privadas.

En versiones futuras:

- Recuperación de contraseña.
- Verificación mediante correo electrónico.
- Inicio de sesión con Google.

---

## Perfil del Usuario

Cada usuario tendrá:

- Nombre.
- Fotografía (opcional).
- Correo electrónico.
- Fecha de registro.
- Historial de votaciones.
- Estadísticas personales.

---

## Salas

Los usuarios podrán crear salas para organizar diferentes votaciones.

Cada sala tendrá:

- Nombre.
- Descripción.
- Imagen (opcional).
- Tipo.
- Código de acceso.
- Propietario.
- Fecha de creación.

---

# Tipos de Sala

## Pública

Cualquier usuario podrá encontrarla y participar.

---

## Privada

Solo podrán ingresar quienes posean:

- Código.
- Enlace.
- Invitación.

---

# Creación de Votaciones

Cada votación podrá configurarse con:

- Título.
- Descripción.
- Fecha de inicio.
- Fecha de finalización.
- Tiempo límite.
- Estado.
- Tipo de votación.
- Número máximo de participantes (opcional).

---

# Tipos de Votación

## Voto secreto

No se mostrará quién votó.

Únicamente se visualizarán los resultados.

---

## Voto público

Será posible visualizar:

- Usuario que votó.
- Opción seleccionada.

---

# Configuraciones Adicionales

El creador podrá configurar:

- Permitir cambiar el voto.
- Un único voto por usuario.
- Varias respuestas.
- Mostrar resultados en tiempo real.
- Mostrar resultados únicamente al finalizar.
- Limitar participantes.
- Cerrar automáticamente la votación.
- Permitir comentarios (versión futura).

---

# Opciones de Respuesta

El sistema permitirá crear preguntas como:

- Sí / No.
- Opción múltiple.
- Selección única.
- Selección múltiple.
- Escalas de calificación.
- Encuestas.

---

# Resultados

Los resultados podrán visualizarse mediante:

- Barras.
- Porcentajes.
- Total de votos.
- Participación.

En futuras versiones podrán agregarse gráficas más avanzadas.

---

# Compartir Votaciones

Cada votación podrá compartirse mediante:

- Enlace.
- Código de acceso.

En futuras versiones:

- Código QR.

---

# Historial

Cada usuario podrá consultar:

- Votaciones creadas.
- Votaciones donde participó.
- Resultados anteriores.
- Fechas de participación.

---

# Seguridad

El sistema implementará buenas prácticas de seguridad:

- Contraseñas cifradas.
- Autenticación mediante JWT.
- Validación de entradas.
- Protección de rutas privadas.
- Manejo adecuado de sesiones.
- Variables de entorno.
- Manejo de errores.
- Protección contra consultas maliciosas.

---

# Diseño

La interfaz deberá cumplir con las siguientes características:

- Moderna.
- Limpia.
- Minimalista.
- Responsive.
- Fácil de utilizar.
- Intuitiva.
- Compatible con dispositivos móviles.
- Navegación sencilla.
- Buenas prácticas de experiencia de usuario (UX).

---

# Objetivo de Aprendizaje

Este proyecto tiene como finalidad aprender el desarrollo Full Stack aplicando una arquitectura similar a la utilizada en proyectos profesionales.

Durante su desarrollo se buscará comprender conceptos como:

- Arquitectura Cliente - Servidor.
- API REST.
- CRUD completo.
- Autenticación con JWT.
- Organización del backend.
- Diseño de bases de datos relacionales.
- Consumo de APIs con JavaScript.
- Manejo de estados.
- Seguridad básica.
- Despliegue de aplicaciones web.
- Buenas prácticas de programación.

El sistema será construido pensando en su escalabilidad, permitiendo agregar nuevas funcionalidades en el futuro sin necesidad de modificar la estructura principal del proyecto.