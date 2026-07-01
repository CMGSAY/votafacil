// frontend/assets/js/poll-detail.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pollId = urlParams.get('id');

    if (!pollId) {
        window.location.href = '/pages/rooms';
        return;
    }

    const alertContainer = document.getElementById('alert-container');
    const pollContent = document.getElementById('poll-content');
    const voteForm = document.getElementById('vote-form');
    const optionsContainer = document.getElementById('options-container');

    // Elementos del detalle de la votacion
    const pollTitle = document.getElementById('poll-title');
    const pollDescription = document.getElementById('poll-description');
    const pollCreator = document.getElementById('poll-creator');
    const pollEndDate = document.getElementById('poll-end-date');
    const pollStatus = document.getElementById('poll-status');
    const pollType = document.getElementById('poll-type');
    const pollVisibility = document.getElementById('poll-visibility');
    
    // Alerta de ya votado
    const hasVotedAlert = document.getElementById('has-voted-alert');

    // Botones de accion
    const backBtn = document.getElementById('back-btn');
    const viewResultsBtn = document.getElementById('view-results-btn');
    const submitVoteBtn = document.getElementById('submit-vote-btn');

    let currentPoll = null;
    let userHasVoted = false;
    const currentUser = window.API.getCurrentUser();

    // Cargar la votacion y sus opciones (Fase 13.4)
    const loadPollDetails = async () => {
        try {
            const response = await window.API.get(`/polls/${pollId}`);

            if (response.success) {
                currentPoll = response.poll;
                userHasVoted = response.hasVoted;
                const totalVotos = response.totalVotos || 0;

                pollContent.style.display = 'block';
                renderPollInfo(currentPoll, userHasVoted, totalVotos);
                
                // Determinar si debemos mostrar los resultados directamente en lugar de las opciones
                const isClosed = currentPoll.estado === 'cerrada';
                const canSeeResults = isClosed || currentPoll.mostrar_resultados === 'tiempo_real';
                const hasVotedAndCannotChange = userHasVoted && !currentPoll.permitir_cambio_voto;
                const isCreatorOrAdmin = currentPoll.creador_id && currentUser && (parseInt(currentPoll.creador_id, 10) === parseInt(currentUser.id, 10) || currentUser.rol === 'administrador');

                if (canSeeResults && (hasVotedAndCannotChange || isClosed || isCreatorOrAdmin)) {
                    loadAndRenderResultsInline();
                } else {
                    renderOptions(currentPoll, userHasVoted);
                }
            } else {
                alertContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${response.message || 'Error al cargar la votacion.'}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error al obtener votacion:', error);
            alertContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error de conexion con el servidor.
                </div>
            `;
        }
    };

    // Cargar y mostrar resultados directamente en el contenedor de opciones (Twitter-style)
    const loadAndRenderResultsInline = async () => {
        try {
            const response = await window.API.get(`/polls/${pollId}/results`);
            if (response.success && !response.resultsHidden) {
                // Ocultar formulario o deshabilitar botón de votar si ya no puede votar
                if (currentPoll.estado === 'cerrada' || (userHasVoted && !currentPoll.permitir_cambio_voto)) {
                    submitVoteBtn.style.display = 'none';
                }
                
                optionsContainer.innerHTML = '';
                
                response.results.resultados.forEach(res => {
                    const item = document.createElement('div');
                    item.className = 'result-item';
                    item.style.marginBottom = '1.2rem';
                    item.innerHTML = `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-weight: 500; font-size: 0.95rem;">
                            <span>${escapeHTML(res.texto_opcion)}</span>
                            <span><strong>${res.votos} votos</strong> (${res.porcentaje}%)</span>
                        </div>
                        <div class="progress-bar-bg" style="height: 10px; background-color: rgba(255, 255, 255, 0.05); border-radius: 5px; overflow: hidden; border: 1px solid var(--border-color);">
                            <div class="progress-bar-fill" id="fill-opt-${res.opcion_id}" style="height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); border-radius: 5px; width: 0%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                        </div>
                    `;
                    optionsContainer.appendChild(item);

                    // Animar la barra
                    setTimeout(() => {
                        const fillElement = document.getElementById(`fill-opt-${res.opcion_id}`);
                        if (fillElement) {
                            fillElement.style.width = `${res.porcentaje}%`;
                        }
                    }, 50);
                });
            } else {
                renderOptions(currentPoll, userHasVoted);
            }
        } catch (error) {
            console.error('Error al cargar resultados en línea:', error);
            renderOptions(currentPoll, userHasVoted);
        }
    };

    // Renderizar informacion general
    const renderPollInfo = (poll, hasVoted, totalVotos) => {
        pollTitle.innerText = poll.titulo;
        pollDescription.innerText = poll.descripcion || 'Sin descripción o instrucciones adicionales.';
        pollCreator.innerText = poll.creador_nombre || 'Desconocido';
        backBtn.href = `/pages/room-detail?id=${poll.sala_id}`;

        // Mostrar total de votos
        const votersCountEl = document.getElementById('poll-voters-count');
        if (votersCountEl) {
            votersCountEl.innerText = totalVotos;
        }

        // Cierre
        if (poll.termina_en) {
            const endStr = new Date(poll.termina_en).toLocaleString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            pollEndDate.innerText = endStr;
        } else {
            pollEndDate.innerText = 'No configurada (Manual)';
        }

        // Tipo badge
        let typeText = 'Selección única';
        if (poll.tipo_voto === 'seleccion_multiple') typeText = `Selección múltiple (Max: ${poll.max_opciones_por_usuario})`;
        if (poll.tipo_voto === 'si_no') typeText = 'Sí / No';
        if (poll.tipo_voto === 'calificacion') typeText = 'Calificación (1 al 5)';
        pollType.innerText = typeText;

        // Visibilidad badge
        pollVisibility.innerText = poll.visibilidad === 'publica' ? 'Voto Público' : 'Voto Secreto';

        // Estado badge
        let statusText = 'Borrador';
        if (poll.estado === 'activa') statusText = 'Activa';
        if (poll.estado === 'cerrada') statusText = 'Cerrada';
        
        pollStatus.className = `status-badge status-${poll.estado}`;
        pollStatus.innerText = statusText;

        // Configurar botones de accion según estado y si ya votó (Fase 13.7)
        const isClosed = poll.estado === 'cerrada';
        const isBorrador = poll.estado === 'borrador';
        
        const isCreator = poll.creador_id && currentUser && parseInt(poll.creador_id, 10) === parseInt(currentUser.id, 10);
        const isAdmin = currentUser && currentUser.rol === 'administrador';

        // Boton resultados visible si ya cerro, si el creador o admin lo solicita, o si la config permite ver en tiempo real
        const resultsVisible = isClosed || poll.mostrar_resultados === 'tiempo_real' || isCreator || isAdmin;
        if (resultsVisible) {
            viewResultsBtn.href = `/pages/results?id=${poll.id}`;
            viewResultsBtn.style.display = 'inline-flex';
        }

        if (isBorrador) {
            submitVoteBtn.style.display = 'none';
            alertContainer.innerHTML = `
                <div class="alert alert-info">
                    Esta votacion se encuentra en modo BORRADOR. No se admiten votos aun.
                </div>
            `;
            return;
        }

        if (isClosed) {
            submitVoteBtn.style.display = 'none';
            hasVotedAlert.style.display = 'none';
            alertContainer.innerHTML = `
                <div class="alert alert-danger">
                    Esta votacion esta CERRADA. No se admiten nuevos votos.
                </div>
            `;
            return;
        }

        // Si la votación está activa y el usuario ya votó (Fase 13.7)
        if (hasVoted) {
            hasVotedAlert.style.display = 'block';

            if (poll.permitir_cambio_voto) {
                hasVotedAlert.innerHTML = `
                    Ya has votado en esta votación. <strong>Se permite cambiar tu voto.</strong> Puedes seleccionar nuevas opciones y enviar.
                `;
                submitVoteBtn.innerText = 'Cambiar Voto';
            } else {
                hasVotedAlert.innerHTML = `
                    Ya has participado en esta votación. No se permite cambiar el voto.
                `;
                submitVoteBtn.style.display = 'none';
            }
        }
    };

    // Renderizar opciones según el formato configurado (Fase 13.5)
    const renderOptions = (poll, hasVoted) => {
        optionsContainer.innerHTML = '';
        const isMultiple = poll.tipo_voto === 'seleccion_multiple';
        const inputType = isMultiple ? 'checkbox' : 'radio';

        poll.opciones.forEach(opt => {
            const label = document.createElement('label');
            label.className = 'option-label';
            label.setAttribute('for', `opt-${opt.id}`);

            // Deshabilitar formulario si ya voto y no puede cambiar, o si esta cerrada
            const isDisabled = (hasVoted && !poll.permitir_cambio_voto) || poll.estado !== 'activa' ? 'disabled' : '';

            label.innerHTML = `
                <input type="${inputType}" id="opt-${opt.id}" name="poll-option" value="${opt.id}" class="option-input" ${isDisabled}>
                <span>${escapeHTML(opt.texto_opcion)}</span>
            `;

            optionsContainer.appendChild(label);
        });

        // Configurar micro-interacciones (resaltar seleccion)
        const labels = optionsContainer.querySelectorAll('.option-label');
        labels.forEach(label => {
            const input = label.querySelector('.option-input');

            // Escuchar cambios
            input.addEventListener('change', () => {
                if (inputType === 'radio') {
                    // Deseleccionar todas las demas clases selected si es radio
                    labels.forEach(l => l.classList.remove('selected'));
                    if (input.checked) label.classList.add('selected');
                } else {
                    // Checkbox
                    if (input.checked) {
                        // Validar limite de seleccion multiple (Fase 13.5 / 13.7)
                        const checkedCount = optionsContainer.querySelectorAll('.option-input:checked').length;
                        if (checkedCount > poll.max_opciones_por_usuario) {
                            input.checked = false;
                            alert(`Solo puedes seleccionar hasta un maximo de ${poll.max_opciones_por_usuario} opciones.`);
                        } else {
                            label.classList.add('selected');
                        }
                    } else {
                        label.classList.remove('selected');
                    }
                }
            });
        });
    };

    // Registrar voto al enviar el formulario (Fase 13.6)
    voteForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const checkedInputs = optionsContainer.querySelectorAll('.option-input:checked');
        if (checkedInputs.length === 0) {
            alert('Por favor, selecciona una opcion antes de votar.');
            return;
        }

        // Deshabilitar boton de envio
        submitVoteBtn.disabled = true;
        submitVoteBtn.innerText = 'Enviando Voto...';

        // Preparar payload
        let payload = {};
        if (currentPoll.tipo_voto === 'seleccion_multiple') {
            const optionIds = Array.from(checkedInputs).map(input => parseInt(input.value, 10));
            payload = { opcion_ids: optionIds };
        } else {
            payload = { opcion_id: parseInt(checkedInputs[0].value, 10) };
        }

        try {
            const response = await window.API.post(`/polls/${pollId}/vote`, payload);

            if (response.success) {
                alertContainer.innerHTML = `
                    <div class="alert alert-success">
                        ¡Tu voto ha sido registrado con éxito!
                    </div>
                `;

                // Redirigir según la configuración (Fase 13.6)
                setTimeout(() => {
                    if (currentPoll.mostrar_resultados === 'tiempo_real') {
                        window.location.href = `/pages/results?id=${pollId}`;
                    } else {
                        window.location.href = `/pages/room-detail?id=${currentPoll.sala_id}`;
                    }
                }, 1500);
            } else {
                alertContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${response.message || 'Error al registrar tu voto.'}
                    </div>
                `;
                submitVoteBtn.disabled = false;
                submitVoteBtn.innerText = userHasVoted ? 'Cambiar Voto' : 'Registrar Voto';
            }
        } catch (error) {
            console.error('Error al votar:', error);
            alertContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error de conexion con el servidor.
                </div>
            `;
            submitVoteBtn.disabled = false;
            submitVoteBtn.innerText = userHasVoted ? 'Cambiar Voto' : 'Registrar Voto';
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
    loadPollDetails();
});
