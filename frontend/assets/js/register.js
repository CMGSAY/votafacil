// frontend/assets/js/register.js

document.addEventListener('DOMContentLoaded', () => {
    // Redirigir si ya esta autenticado
    if (window.API.isAuthenticated()) {
        window.location.href = '/pages/rooms';
        return;
    }

    const registerForm = document.getElementById('register-form');
    const alertContainer = document.getElementById('alert-container');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Limpiar alertas anteriores
        alertContainer.innerHTML = '';

        // Deshabilitar boton de envio
        const btnSubmit = document.getElementById('btn-submit');
        btnSubmit.disabled = true;
        btnSubmit.innerText = 'Registrando...';

        try {
            const response = await window.API.post('/auth/register', {
                nombre_usuario: username,
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
                        Cuenta creada exitosamente. Redirigiendo a salas...
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
                        ${response.message || 'Error al intentar registrar la cuenta.'}
                    </div>
                `;
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Registrarse';
            }
        } catch (error) {
            console.error('Error al registrar:', error);
            alertContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error de conexion con el servidor. Intente mas tarde.
                </div>
            `;
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Registrarse';
        }
    });
});
