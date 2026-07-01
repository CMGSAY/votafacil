// frontend/assets/js/room-create.js

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');
    const isEditMode = !!roomId;

    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const btnSubmit = document.getElementById('btn-submit');
    const roomForm = document.getElementById('room-form');
    const alertContainer = document.getElementById('alert-container');

    // Inputs del formulario
    const roomNameInput = document.getElementById('room-name');
    const roomDescInput = document.getElementById('room-desc');
    const roomImageInput = document.getElementById('room-image');
    const roomTypeSelect = document.getElementById('room-type');
    const accessCodeGroup = document.getElementById('access-code-group');
    const roomCodeInput = document.getElementById('room-code');

    // Mostrar/ocultar dinamicamente el campo de codigo de acceso (Fase 12.5)
    roomTypeSelect.addEventListener('change', () => {
        if (roomTypeSelect.value === 'privada') {
            accessCodeGroup.style.display = 'block';
            roomCodeInput.required = true;
        } else {
            accessCodeGroup.style.display = 'none';
            roomCodeInput.required = false;
            roomCodeInput.value = '';
        }
    });

    // Si estamos en modo edicion, cargar datos previos (Fase 12.4)
    if (isEditMode) {
        formTitle.innerText = 'Editar Sala';
        formSubtitle.innerText = 'Modifica los datos de configuración de tu sala.';
        btnSubmit.innerText = 'Guardar Cambios';

        try {
            const response = await window.API.get(`/rooms/${roomId}`);
            if (response.success) {
                const room = response.room;
                roomNameInput.value = room.nombre;
                roomDescInput.value = room.descripcion || '';
                roomImageInput.value = room.url_imagen || '';
                roomTypeSelect.value = room.tipo;

                // Desencadenar cambio de UI para tipo de sala
                if (room.tipo === 'privada') {
                    accessCodeGroup.style.display = 'block';
                    roomCodeInput.required = true;
                    roomCodeInput.value = room.codigo_acceso || '';
                }
            } else {
                alertContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${response.message || 'No se pudieron recuperar los datos de la sala.'}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error al precargar sala:', error);
            alertContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error al conectar con el servidor.
                </div>
            `;
        }
    }

    // Gestionar el envio del formulario (Fase 12.4)
    roomForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = roomNameInput.value.trim();
        const descripcion = roomDescInput.value.trim();
        const url_imagen = roomImageInput.value.trim();
        const tipo = roomTypeSelect.value;
        const codigo_acceso = roomCodeInput.value.trim();

        // Limpiar contenedor de alertas
        alertContainer.innerHTML = '';
        btnSubmit.disabled = true;
        btnSubmit.innerText = isEditMode ? 'Guardando...' : 'Creando...';

        const payload = {
            nombre,
            descripcion,
            url_imagen: url_imagen || null,
            tipo,
            codigo_acceso: tipo === 'privada' ? codigo_acceso : null
        };

        try {
            let response;
            if (isEditMode) {
                response = await window.API.put(`/rooms/${roomId}`, payload);
            } else {
                response = await window.API.post('/rooms', payload);
            }

            if (response.success) {
                alertContainer.innerHTML = `
                    <div class="alert alert-success">
                        Sala ${isEditMode ? 'actualizada' : 'creada'} correctamente. Redirigiendo...
                    </div>
                `;
                
                const targetRoomId = isEditMode ? roomId : response.room.id;
                setTimeout(() => {
                    window.location.href = `/pages/room-detail?id=${targetRoomId}`;
                }, 1500);
            } else {
                alertContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${response.message || 'Ocurrio un error al intentar procesar la sala.'}
                    </div>
                `;
                btnSubmit.disabled = false;
                btnSubmit.innerText = isEditMode ? 'Guardar Cambios' : 'Crear Sala';
            }
        } catch (error) {
            console.error('Error al guardar sala:', error);
            alertContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error de conexion con el servidor.
                </div>
            `;
            btnSubmit.disabled = false;
            btnSubmit.innerText = isEditMode ? 'Guardar Cambios' : 'Crear Sala';
        }
    });
});
