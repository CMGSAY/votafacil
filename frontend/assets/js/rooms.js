// frontend/assets/js/rooms.js

document.addEventListener('DOMContentLoaded', () => {
    let allRooms = [];
    const roomsGrid = document.getElementById('rooms-grid');
    const searchInput = document.getElementById('search-input');
    const alertContainer = document.getElementById('alert-container');

    // Cargar las salas del servidor (Fase 12.2)
    const fetchRooms = async () => {
        try {
            const response = await window.API.get('/rooms');
            
            if (response.success) {
                allRooms = response.rooms;
                renderRooms(allRooms);
            } else {
                alertContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${response.message || 'Error al cargar las salas de votacion.'}
                    </div>
                `;
                roomsGrid.innerHTML = '<div class="no-rooms">No se pudieron cargar las salas.</div>';
            }
        } catch (error) {
            console.error('Error al obtener salas:', error);
            roomsGrid.innerHTML = '<div class="no-rooms">Error de conexion con el servidor.</div>';
        }
    };

    // Renderizar la lista de salas en la grilla
    const renderRooms = (rooms) => {
        roomsGrid.innerHTML = '';

        if (rooms.length === 0) {
            roomsGrid.innerHTML = '<div class="no-rooms">No se encontraron salas públicas disponibles.</div>';
            return;
        }

        rooms.forEach(room => {
            const dateStr = new Date(room.creado_en).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const card = document.createElement('div');
            card.className = 'card room-card';
            card.innerHTML = `
                <span class="room-badge badge-${room.tipo}">${room.tipo === 'publica' ? 'Pública' : 'Privada'}</span>
                <h3 class="room-name">${escapeHTML(room.nombre)}</h3>
                <p class="room-desc">${escapeHTML(room.descripcion || 'Sin descripción disponible.')}</p>
                <div class="room-meta">
                    <span>Por: <strong>${escapeHTML(room.propietario_nombre || 'Desconocido')}</strong></span>
                    <span>${dateStr}</span>
                </div>
                <a href="/pages/room-detail?id=${room.id}" class="btn btn-secondary" style="width: 100%; text-align: center;">Entrar a la Sala</a>
            `;
            roomsGrid.appendChild(card);
        });
    };

    // Filtro de búsqueda local
    searchInput.addEventListener('input', (e) => {
        const text = e.target.value.toLowerCase().trim();
        const filtered = allRooms.filter(room => 
            room.nombre.toLowerCase().includes(text) || 
            (room.descripcion && room.descripcion.toLowerCase().includes(text))
        );
        renderRooms(filtered);
    });

    // Helper para escapar HTML y prevenir XSS
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Iniciar peticion
    fetchRooms();
});
