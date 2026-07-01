// frontend/assets/js/room-detail.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('id');

    if (!roomId) {
        window.location.href = '/pages/rooms';
        return;
    }

    const privateAuth = document.getElementById('private-auth');
    const roomContent = document.getElementById('room-content');
    const privateCodeForm = document.getElementById('private-code-form');
    const codeAlert = document.getElementById('code-alert');
    const alertContainer = document.getElementById('alert-container');

    // Elementos del detalle de la sala
    const roomTitle = document.getElementById('room-title');
    const roomBadge = document.getElementById('room-badge');
    const roomOwner = document.getElementById('room-owner');
    const roomDate = document.getElementById('room-date');
    const roomDescription = document.getElementById('room-description');
    
    // Botones de accion admin
    const adminActions = document.getElementById('admin-actions');
    const editRoomBtn = document.getElementById('edit-room-btn');
    const deleteRoomBtn = document.getElementById('delete-room-btn');
    const createPollBtn = document.getElementById('create-poll-btn');
    
    // Listado de votaciones
    const pollsList = document.getElementById('polls-list');

    let currentRoom = null;
    const currentUser = window.API.getCurrentUser();

    // Cargar la sala e iniciar el flujo de comprobacion de permisos (Fase 12.3 y 12.5)
    const loadRoomDetails = async (code = null) => {
        alertContainer.innerHTML = '';
        codeAlert.innerHTML = '';

        try {
            const queryParams = code ? { codigo: code } : null;
            const response = await window.API.get(`/rooms/${roomId}`, queryParams);

            if (response.success) {
                currentRoom = response.room;
                
                // Mostrar contenido de sala y ocultar el formulario de codigo
                privateAuth.style.display = 'none';
                roomContent.style.display = 'block';

                renderRoomInfo(currentRoom);
                fetchPolls();
            } else if (response.requiresCode) {
                // Si la sala es privada y requiere el codigo de acceso (Fase 12.5)
                privateAuth.style.display = 'block';
                roomContent.style.display = 'none';
            } else {
                alertContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${response.message || 'Error al obtener la sala.'}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error al cargar detalle de sala:', error);
            alertContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error de conexion con el servidor.
                </div>
            `;
        }
    };

    // Renderizar la informacion general de la sala
    const renderRoomInfo = (room) => {
        roomTitle.innerText = room.nombre;
        roomDescription.innerText = room.descripcion || 'Sin descripción disponible.';
        roomOwner.innerText = room.propietario_nombre || 'Desconocido';
        
        const dateStr = new Date(room.creado_en).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        roomDate.innerText = dateStr;

        // Tipo de sala badge
        roomBadge.className = `room-type-badge badge-${room.tipo}`;
        roomBadge.innerText = room.tipo === 'publica' ? 'Pública' : 'Privada';

        // Validar si el usuario actual es el propietario de la sala o es administrador (Fase 12.6)
        const isOwner = parseInt(room.propietario_id, 10) === parseInt(currentUser.id, 10);
        const isAdmin = currentUser.rol === 'administrador';

        if (isOwner || isAdmin) {
            adminActions.style.display = 'flex';
            editRoomBtn.href = `/pages/room-create?id=${room.id}`;
            
            // Permitir crear votaciones solo al dueño o admin
            createPollBtn.href = `/pages/poll-create?sala_id=${room.id}`;
            createPollBtn.style.display = 'block';
        } else {
            createPollBtn.style.display = 'none';
        }
    };

    // Obtener las votaciones de la sala
    const fetchPolls = async () => {
        try {
            const response = await window.API.get(`/rooms/${roomId}/polls`);

            if (response.success) {
                renderPolls(response.polls);
            } else {
                pollsList.innerHTML = '<div class="no-polls">Error al cargar las votaciones de la sala.</div>';
            }
        } catch (error) {
            console.error('Error al cargar votaciones:', error);
            pollsList.innerHTML = '<div class="no-polls">Error de conexion al buscar votaciones.</div>';
        }
    };

    // Renderizar la lista de votaciones
    const renderPolls = (polls) => {
        pollsList.innerHTML = '';

        if (polls.length === 0) {
            pollsList.innerHTML = '<div class="no-polls">No hay votaciones creadas en esta sala.</div>';
            return;
        }

        polls.forEach(poll => {
            const card = document.createElement('div');
            card.className = 'card poll-card';

            // Traducir tipo de voto
            let tipoVotoTexto = 'Selección única';
            if (poll.tipo_voto === 'seleccion_multiple') tipoVotoTexto = 'Selección múltiple';
            if (poll.tipo_voto === 'si_no') tipoVotoTexto = 'Sí / No';
            if (poll.tipo_voto === 'calificacion') tipoVotoTexto = 'Calificación';

            // Traducir estado
            let estadoTexto = 'Borrador';
            if (poll.estado === 'activa') estadoTexto = 'Activa';
            if (poll.estado === 'cerrada') estadoTexto = 'Cerrada';

            // Mostrar botón eliminar si es creador de la votación, propietario de la sala, o administrador
            const isCreator = parseInt(poll.creador_id, 10) === parseInt(currentUser.id, 10);
            const isRoomOwner = currentRoom && parseInt(currentRoom.propietario_id, 10) === parseInt(currentUser.id, 10);
            const isAdmin = currentUser.rol === 'administrador';
            const deleteBtnHtml = (isCreator || isRoomOwner || isAdmin) 
                ? `<button class="btn btn-secondary delete-poll-btn" data-id="${poll.id}" style="color: var(--danger); border-color: rgba(239,68,68,0.2);">Eliminar</button>` 
                : '';

            card.innerHTML = `
                <div class="poll-info">
                    <div class="poll-badge-row">
                        <span class="status-badge status-${poll.estado}">${estadoTexto}</span>
                        <span class="type-badge">${tipoVotoTexto}</span>
                        <span class="type-badge">${poll.visibilidad === 'publica' ? 'Voto Público' : 'Voto Secreto'}</span>
                        <span class="type-badge" style="background-color: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.2); color: #a5b4fc;">
                            Votos: ${poll.total_votos || 0}
                        </span>
                    </div>
                    <h3 class="poll-title">${escapeHTML(poll.titulo)}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 0;">${escapeHTML(poll.descripcion || 'Sin descripción.')}</p>
                </div>
                <div class="poll-actions">
                    ${deleteBtnHtml}
                    <a href="/pages/poll-detail?id=${poll.id}" class="btn btn-primary">Ingresar</a>
                </div>
            `;
            pollsList.appendChild(card);
        });
    };

    // Manejar ingreso del codigo para salas privadas (Fase 12.5)
    privateCodeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('room-code').value.trim();
        loadRoomDetails(code);
    });

    // Eliminar la sala
    const handleDeleteRoom = async () => {
        if (!confirm('¿Eliminar esta sala y todas sus votaciones?')) return;

        try {
            const data = await window.API.delete(`/rooms/${roomId}`);
            if (data.success) {
                alert('Sala eliminada correctamente.');
                window.location.href = '/pages/rooms';
            } else {
                alert('Error: ' + (data.message || 'No se pudo eliminar la sala.'));
            }
        } catch (error) {
            alert('Error de conexión: ' + error.message);
        }
    };

    // Eliminar votación
    const handleDeletePoll = async (pollId) => {
        if (!confirm('¿Eliminar esta votación?')) return;

        try {
            const data = await window.API.delete(`/polls/${pollId}`);
            if (data.success) {
                fetchPolls();
            } else {
                alert('Error: ' + (data.message || 'No se pudo eliminar la votación.'));
            }
        } catch (error) {
            alert('Error de conexión: ' + error.message);
        }
    };

    // Asignar event listeners
    if (deleteRoomBtn) {
        deleteRoomBtn.addEventListener('click', handleDeleteRoom);
    }

    // Delegación de eventos para eliminar votaciones
    pollsList.addEventListener('click', async (e) => {
        if (e.target && e.target.classList.contains('delete-poll-btn')) {
            const pollId = e.target.getAttribute('data-id');
            await handleDeletePoll(pollId);
        }
    });

    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Carga inicial
    loadRoomDetails();
});
