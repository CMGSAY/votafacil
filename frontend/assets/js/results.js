// frontend/assets/js/results.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pollId = urlParams.get('id');

    if (!pollId) {
        window.location.href = '/pages/rooms';
        return;
    }

    const alertContainer = document.getElementById('alert-container');
    const resultsContent = document.getElementById('results-content');
    
    // Elementos descriptivos
    const pollTitle = document.getElementById('poll-title');
    const pollDescription = document.getElementById('poll-description');
    const pollCreator = document.getElementById('poll-creator');
    const pollStatus = document.getElementById('poll-status');
    const pollType = document.getElementById('poll-type');
    const pollVisibility = document.getElementById('poll-visibility');
    
    // Contenedores alternativos
    const resultsHiddenCard = document.getElementById('results-hidden-card');
    const resultsHiddenMessage = document.getElementById('results-hidden-message');
    const resultsVisualizer = document.getElementById('results-visualizer');
    
    // Contenido resultados
    const optionsResultsList = document.getElementById('options-results-list');
    const totalVoters = document.getElementById('total-voters');
    const participationRate = document.getElementById('participation-rate');
    
    // Votos publicos
    const publicVotesSection = document.getElementById('public-votes-section');
    const publicVotesList = document.getElementById('public-votes-list');
    
    const backBtn = document.getElementById('back-btn');

    let currentPoll = null;

    // Cargar datos de la votacion y luego resultados
    const loadResultsPage = async () => {
        try {
            // 1. Obtener detalles generales de la votacion
            const pollResponse = await window.API.get(`/polls/${pollId}`);

            if (pollResponse.success) {
                currentPoll = pollResponse.poll;
                resultsContent.style.display = 'block';
                renderPollDetails(currentPoll);
                
                // 2. Obtener resultados especificos (Fase 14.4)
                const resultsResponse = await window.API.get(`/polls/${pollId}/results`);
                
                if (resultsResponse.success) {
                    if (resultsResponse.resultsHidden) {
                        // Resultados ocultos (Fase 14.4)
                        resultsHiddenCard.style.display = 'block';
                        resultsVisualizer.style.display = 'none';
                        resultsHiddenMessage.innerText = resultsResponse.message || 'Los resultados estan ocultos.';
                    } else {
                        // Resultados visibles
                        resultsHiddenCard.style.display = 'none';
                        resultsVisualizer.style.display = 'block';
                        renderResults(resultsResponse.results, currentPoll);
                    }
                } else {
                    alertContainer.innerHTML = `
                        <div class="alert alert-danger">
                            ${resultsResponse.message || 'Error al cargar los resultados.'}
                        </div>
                    `;
                }
            } else {
                alertContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${pollResponse.message || 'No se pudo encontrar la votacion.'}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error al cargar resultados:', error);
            alertContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error de conexion con el servidor.
                </div>
            `;
        }
    };

    // Renderizar detalles de votacion
    const renderPollDetails = (poll) => {
        pollTitle.innerText = poll.titulo;
        pollDescription.innerText = poll.descripcion || 'Sin descripción o instrucciones adicionales.';
        pollCreator.innerText = poll.creador_nombre || 'Desconocido';
        backBtn.href = `/pages/poll-detail?id=${poll.id}`;

        // Tipo badge
        let typeText = 'Selección única';
        if (poll.tipo_voto === 'seleccion_multiple') typeText = 'Selección múltiple';
        if (poll.tipo_voto === 'si_no') typeText = 'Sí / No';
        if (poll.tipo_voto === 'calificacion') typeText = 'Calificación';
        pollType.innerText = typeText;

        // Visibilidad badge
        pollVisibility.innerText = poll.visibilidad === 'publica' ? 'Voto Público' : 'Voto Secreto';

        // Estado badge
        let statusText = 'Borrador';
        if (poll.estado === 'activa') statusText = 'Activa';
        if (poll.estado === 'cerrada') statusText = 'Cerrada';
        
        pollStatus.className = `status-badge status-${poll.estado}`;
        pollStatus.innerText = statusText;
    };

    // Renderizar graficos de resultados (Fase 14.2)
    const renderResults = (results, poll) => {
        optionsResultsList.innerHTML = '';
        
        // Renderizar opciones y barras
        results.resultados.forEach(res => {
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <div class="result-label">
                    <span>${escapeHTML(res.texto_opcion)}</span>
                    <span><strong>${res.votos} votos</strong> (${res.porcentaje}%)</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" id="fill-opt-${res.opcion_id}"></div>
                </div>
            `;
            optionsResultsList.appendChild(item);

            // Animar el llenado de la barra despues de insertar en el DOM (micro-animacion premium)
            setTimeout(() => {
                const fillElement = document.getElementById(`fill-opt-${res.opcion_id}`);
                if (fillElement) {
                    fillElement.style.width = `${res.porcentaje}%`;
                }
            }, 100);
        });

        // Totales y participacion (Fase 14.3)
        totalVoters.innerText = results.total_participantes;

        if (poll.max_participantes) {
            const rate = ((results.total_participantes / poll.max_participantes) * 100).toFixed(0);
            participationRate.innerHTML = `Límite de participación: <strong>${results.total_participantes} / ${poll.max_participantes}</strong> (${rate}%)`;
            participationRate.style.display = 'inline';
        } else {
            participationRate.style.display = 'none';
        }

        // Votos públicos detalle (Fase 14.5)
        if (results.visibilidad === 'publica' && results.detalle_votos && results.detalle_votos.length > 0) {
            publicVotesSection.style.display = 'block';
            publicVotesList.innerHTML = '';

            results.detalle_votos.forEach(vote => {
                // Encontrar el texto de la opcion correspondiente al opcion_id
                const option = results.resultados.find(r => r.opcion_id === vote.opcion_id);
                const optionText = option ? option.texto_opcion : 'Desconocida';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${escapeHTML(vote.nombre_usuario)}</strong></td>
                    <td>${escapeHTML(optionText)}</td>
                `;
                publicVotesList.appendChild(tr);
            });
        } else {
            publicVotesSection.style.display = 'none';
        }
    };

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
    loadResultsPage();
});
