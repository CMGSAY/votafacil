// frontend/assets/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    // Redirigir si ya esta autenticado
    if (window.API.isAuthenticated()) {
        window.location.href = '/pages/rooms';
        return;
    }

    const loginForm = document.getElementById('login-form');
    const alertContainer = document.getElementById('alert-container');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Limpiar alertas anteriores
        alertContainer.innerHTML = '';

        // Deshabilitar boton de envio
        const btnSubmit = document.getElementById('btn-submit');
        btnSubmit.disabled = true;
        btnSubmit.innerText = 'Ingresando...';

        try {
            const response = await window.API.post('/auth/login', {
                correo: email,
                clave: password
            });

            if (response.success) {
                // Guardar credenciales en localStorage (Fase 11.5)
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));

                // Mostrar alerta de exito (Fase 11.8)
                alertContainer.innerHTML = `
                    <div class="alert alert-success">
                        Inicio de sesion exitoso. Redirigiendo a salas...
                    </div>
                `;

                // Redirigir despues de un breve tiempo
                setTimeout(() => {
                    window.location.href = '/pages/rooms';
                }, 1500);
            } else {
                // Mostrar error devuelto por la API (Fase 11.8)
                alertContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${response.message || 'Credenciales incorrectas.'}
                    </div>
                `;
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Ingresar';
            }
        } catch (error) {
            console.error('Error al iniciar sesion:', error);
            alertContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error de conexion con el servidor. Intente mas tarde.
                </div>
            `;
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Ingresar';
        }
    });
});
