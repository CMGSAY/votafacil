// frontend/assets/js/poll-create.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const salaId = urlParams.get('sala_id');

    if (!salaId) {
        window.location.href = '/pages/rooms';
        return;
    }

    // Configurar boton de cancelar
    const cancelBtn = document.getElementById('cancel-btn');
    cancelBtn.href = `/pages/room-detail?id=${salaId}`;

    const pollForm = document.getElementById('poll-form');
    const alertContainer = document.getElementById('alert-container');
    const btnSubmit = document.getElementById('btn-submit');

    // Inputs
    const pollTitleInput = document.getElementById('poll-title');
    const pollDescInput = document.getElementById('poll-desc');
    const pollTypeSelect = document.getElementById('poll-type');
    const maxOptionsGroup = document.getElementById('max-options-group');
    const pollMaxOptsInput = document.getElementById('poll-max-opts');
    const optionsSection = document.getElementById('options-section');
    const optionsList = document.getElementById('options-list');
    const addOptBtn = document.getElementById('add-opt-btn');
    const pollVisibilitySelect = document.getElementById('poll-visibility');
    const pollResultsShowSelect = document.getElementById('poll-results-show');
    const pollMaxParticipantsInput = document.getElementById('poll-max-participants');
    const pollStatusSelect = document.getElementById('poll-status');
    const pollStartsInput = document.getElementById('poll-starts');
    const pollEndsInput = document.getElementById('poll-ends');
    const pollAllowChangeCheckbox = document.getElementById('poll-allow-change');
    const pollAutoCloseCheckbox = document.getElementById('poll-auto-close');

    // Manejar tipos de votacion dinamicamente (Fase 13.2 y 13.5)
    pollTypeSelect.addEventListener('change', () => {
        const type = pollTypeSelect.value;
        if (type === 'seleccion_unica' || type === 'seleccion_multiple') {
            optionsSection.style.display = 'block';
            toggleOptionInputRequirements(true);
            if (type === 'seleccion_multiple') {
                maxOptionsGroup.style.display = 'block';
            } else {
                maxOptionsGroup.style.display = 'none';
            }
        } else {
            // si_no y calificacion no requieren ingresar opciones manualmente (auto-generado en backend)
            optionsSection.style.display = 'none';
            maxOptionsGroup.style.display = 'none';
            toggleOptionInputRequirements(false);
        }
    });

    const toggleOptionInputRequirements = (isRequired) => {
        const inputs = optionsList.querySelectorAll('.poll-option-input');
        inputs.forEach(input => {
            input.required = isRequired;
        });
    };

    // Agregar opcion de respuesta dinamicamente
    addOptBtn.addEventListener('click', () => {
        const optionItems = optionsList.querySelectorAll('.option-item');
        const count = optionItems.length + 1;

        const newItem = document.createElement('div');
        newItem.className = 'option-item';
        newItem.innerHTML = `
            <input type="text" class="form-control poll-option-input" placeholder="Opción ${count}" required>
            <button type="button" class="btn btn-danger remove-opt-btn" style="padding: 0.75rem;">Eliminar</button>
        `;
        optionsList.appendChild(newItem);
        
        updateRemoveButtonsState();
    });

    // Delegar evento de eliminacion de opciones
    optionsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-opt-btn')) {
            const item = e.target.closest('.option-item');
            item.remove();
            
            // Renombrar placeholders para consistencia visual
            const inputs = optionsList.querySelectorAll('.poll-option-input');
            inputs.forEach((input, index) => {
                input.placeholder = `Opción ${index + 1}`;
            });

            updateRemoveButtonsState();
        }
    });

    // Actualizar estado de los botones de eliminacion (Minimo 2 opciones)
    const updateRemoveButtonsState = () => {
        const removeButtons = optionsList.querySelectorAll('.remove-opt-btn');
        if (removeButtons.length <= 2) {
            removeButtons.forEach(btn => btn.disabled = true);
        } else {
            removeButtons.forEach(btn => btn.disabled = false);
        }
    };

    // Gestionar el envio del formulario (Fase 13.2)
    pollForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const type = pollTypeSelect.value;
        const opciones = [];

        if (type === 'seleccion_unica' || type === 'seleccion_multiple') {
            const optionInputs = optionsList.querySelectorAll('.poll-option-input');
            optionInputs.forEach(input => {
                const val = input.value.trim();
                if (val !== '') {
                    opciones.push(val);
                }
            });

            if (opciones.length < 2) {
                alertContainer.innerHTML = `
                    <div class="alert alert-danger">
                        Debes ingresar al menos 2 opciones de respuesta.
                    </div>
                `;
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Crear Votación';
                return;
            }
        }

        alertContainer.innerHTML = '';
        btnSubmit.disabled = true;
        btnSubmit.innerText = 'Creando Votación...';

        const payload = {
            sala_id: parseInt(salaId, 10),
            titulo: pollTitleInput.value.trim(),
            descripcion: pollDescInput.value.trim(),
            tipo_voto: type,
            visibilidad: pollVisibilitySelect.value,
            mostrar_resultados: pollResultsShowSelect.value,
            permitir_cambio_voto: pollAllowChangeCheckbox.checked ? 1 : 0,
            max_opciones_por_usuario: type === 'seleccion_multiple' ? parseInt(pollMaxOptsInput.value, 10) : 1,
            max_participantes: pollMaxParticipantsInput.value ? parseInt(pollMaxParticipantsInput.value, 10) : null,
            inicia_en: pollStartsInput.value ? pollStartsInput.value : null,
            termina_en: pollEndsInput.value ? pollEndsInput.value : null,
            cierre_automatico: pollAutoCloseCheckbox.checked ? 1 : 0,
            estado: pollStatusSelect.value,
            opciones
        };

        console.log('Sending payload:', payload);
        try {
            console.log('Calling API.post("/polls", payload)...');
            const response = await window.API.post('/polls', payload);
            console.log('API response received:', response);
            if (response.success) {
                alertContainer.innerHTML = `
                    <div class="alert alert-success">
                        Votación creada exitosamente. Redirigiendo...
                    </div>
                `;
                setTimeout(() => {
                    window.location.href = `/pages/room-detail?id=${salaId}`;
                }, 1500);
            } else {
                alertContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${response.message || 'Error al intentar crear la votación.'}
                    </div>
                `;
                btnSubmit.disabled = false;
                btnSubmit.innerText = 'Crear Votación';
            }
        } catch (error) {
            console.error('Error al guardar votacion:', error);
            alertContainer.innerHTML = `
                <div class="alert alert-danger">
                    Error de conexion con el servidor.
                </div>
            `;
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Crear Votación';
        }
    });

    // Iniciar estado de botones
    updateRemoveButtonsState();
});
