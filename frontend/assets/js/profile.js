// frontend/assets/js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.API.getCurrentUser();

    if (!currentUser) {
        window.location.href = '/pages/login';
        return;
    }

    const profileForm = document.getElementById('profile-form');
    const profileAlert = document.getElementById('profile-alert');
    const submitProfileBtn = document.getElementById('submit-profile-btn');

    // UI elements
    const avatarContainer = document.getElementById('avatar-container');
    const displayName = document.getElementById('profile-display-name');
    const displayRole = document.getElementById('profile-display-role');

    // Inputs
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const avatarUrlInput = document.getElementById('avatar-url');
    const passwordInput = document.getElementById('password');

    // Stats
    const statCreated = document.getElementById('stat-created');
    const statVoted = document.getElementById('stat-voted');

    // Tab buttons
    const tabCreatedBtn = document.getElementById('tab-created-btn');
    const tabVotedBtn = document.getElementById('tab-voted-btn');
    const historyList = document.getElementById('history-list');

    let historyData = { creadas: [], participadas: [] };
    let currentTab = 'creadas';

    // Cargar perfil completo (Fase 15.1 y 15.2)
    const loadProfile = async () => {
        try {
            const response = await window.API.get(`/users/${currentUser.id}`);
            if (response.success) {
                const user = response.user;
                usernameInput.value = user.nombre_usuario;
                emailInput.value = user.correo;
                avatarUrlInput.value = user.url_avatar || '';
                displayName.innerText = user.nombre_usuario;
                displayRole.innerText = user.rol === 'administrador' ? 'Administrador' : 'Votante Registrado';

                // Mostrar inicial o imagen
                updateAvatarUI(user.nombre_usuario, user.url_avatar);
            } else {
                profileAlert.innerHTML = `
                    <div class="alert alert-danger">
                        ${response.message || 'Error al recuperar informacion de perfil.'}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            profileAlert.innerHTML = `
                <div class="alert alert-danger">
                    Error de conexion con el servidor.
                </div>
            `;
        }
    };

    const updateAvatarUI = (name, url) => {
        if (url && url.trim() !== '') {
            avatarContainer.innerHTML = `<img src="${url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            avatarContainer.innerText = name.charAt(0).toUpperCase();
        }
    };

    // Modificar datos del perfil (Fase 15.2)
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre_usuario = usernameInput.value.trim();
        const correo = emailInput.value.trim();
        const url_avatar = avatarUrlInput.value.trim();
        const clave = passwordInput.value;

        profileAlert.innerHTML = '';
        submitProfileBtn.disabled = true;
        submitProfileBtn.innerText = 'Guardando...';

        const payload = {
            nombre_usuario,
            correo,
            url_avatar: url_avatar || null
        };

        if (clave && clave.trim() !== '') {
            payload.clave = clave;
        }

        try {
            const response = await window.API.put(`/users/${currentUser.id}`, payload);
            if (response.success) {
                profileAlert.innerHTML = `
                    <div class="alert alert-success">
                        Perfil actualizado con éxito.
                    </div>
                `;
                
                // Actualizar informacion local de sesion
                localStorage.setItem('user', JSON.stringify(response.user));
                displayName.innerText = response.user.nombre_usuario;
                updateAvatarUI(response.user.nombre_usuario, response.user.url_avatar);
                passwordInput.value = ''; // limpiar clave
            } else {
                profileAlert.innerHTML = `
                    <div class="alert alert-danger">
                        ${response.message || 'Error al actualizar perfil.'}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error al guardar perfil:', error);
            profileAlert.innerHTML = `
                <div class="alert alert-danger">
                    Error de conexion con el servidor.
                </div>
            `;
        } finally {
            submitProfileBtn.disabled = false;
            submitProfileBtn.innerText = 'Guardar Perfil';
        }
    });

    // Cargar historial y estadisticas (Fase 15.3 y 15.4)
    const loadHistory = async () => {
        try {
            const response = await window.API.get(`/users/${currentUser.id}/history`);
            if (response.success) {
                historyData.creadas = response.creadas;
                historyData.participadas = response.participadas;

                // Actualizar contadores de estadisticas (Fase 15.4)
                statCreated.innerText = response.creadas.length;
                statVoted.innerText = response.participadas.length;

                renderHistoryList();
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
            historyList.innerHTML = '<div style="text-align: center; padding: 2rem;">Error al cargar historial.</div>';
        }
    };

    // Renderizar la lista de historial segun la pestaña activa
    const renderHistoryList = () => {
        historyList.innerHTML = '';
        const list = currentTab === 'creadas' ? historyData.creadas : historyData.participadas;

        if (list.length === 0) {
            historyList.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 3rem 1rem;">
                    No se registran votaciones en esta categoria.
                </div>
            `;
            return;
        }

        list.forEach(poll => {
            const dateField = currentTab === 'creadas' ? poll.creado_en : poll.participado_en;
            const dateStr = new Date(dateField).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const item = document.createElement('div');
            item.className = 'history-item';
            
            // Traducir estado
            let estadoTexto = 'Borrador';
            if (poll.estado === 'activa') estadoTexto = 'Activa';
            if (poll.estado === 'cerrada') estadoTexto = 'Cerrada';

            item.innerHTML = `
                <div class="history-info">
                    <h4 class="history-title">${escapeHTML(poll.titulo)}</h4>
                    <div class="history-meta">
                        Sala: <strong>${escapeHTML(poll.sala_nombre)}</strong> | 
                        Fecha: <span>${dateStr}</span> | 
                        Estado: <span class="status-badge status-${poll.estado}" style="padding: 0.1rem 0.3rem; font-size: 0.65rem;">${estadoTexto}</span>
                    </div>
                </div>
                <div>
                    <a href="/pages/poll-detail?id=${poll.id}" class="btn btn-secondary btn-sm">Ver Detalles</a>
                </div>
            `;
            historyList.appendChild(item);
        });
    };

    // Manejar pestañas
    tabCreatedBtn.addEventListener('click', () => {
        if (currentTab !== 'creadas') {
            currentTab = 'creadas';
            tabCreatedBtn.classList.add('active');
            tabVotedBtn.classList.remove('active');
            renderHistoryList();
        }
    });

    tabVotedBtn.addEventListener('click', () => {
        if (currentTab !== 'participadas') {
            currentTab = 'participadas';
            tabVotedBtn.classList.add('active');
            tabCreatedBtn.classList.remove('active');
            renderHistoryList();
        }
    });

    // Helper para escapar HTML
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
    loadProfile();
    loadHistory();
});
