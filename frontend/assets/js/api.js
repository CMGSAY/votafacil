
const API_BASE_URL = 'http://localhost:3000/api';

// Configurar objeto global API
window.API = {
    // Helper para realizar peticiones HTTP de forma centralizada
    request: async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        
        // Configurar cabeceras por defecto
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Adjuntar token de autorizacion si existe en localStorage
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            // Si la respuesta es un error de token expirado o invalido
            if (response.status === 401 && token) {
                // Limpiar sesion local y redirigir al login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/pages/login';
                return { success: false, message: 'Su sesion ha expirado. Por favor, inicie sesion nuevamente.' };
            }

            return {
                status: response.status,
                ok: response.ok,
                ...data
            };
        } catch (error) {
            console.error(`Error en peticion API (${endpoint}):`, error);
            return {
                success: false,
                message: 'No se pudo establecer conexion con el servidor.'
            };
        }
    },

    // Peticion GET
    get: (endpoint, queryParams = null) => {
        let url = endpoint;
        if (queryParams) {
            const params = new URLSearchParams(queryParams).toString();
            url += `?${params}`;
        }
        return window.API.request(url, { method: 'GET' });
    },

    // Peticion POST
    post: (endpoint, body = {}) => {
        return window.API.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    // Peticion PUT
    put: (endpoint, body = {}) => {
        return window.API.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    // Peticion DELETE (ambas formas para compatibilidad)
    delete: (endpoint) => {
        return window.API.request(endpoint, {
            method: 'DELETE'
        });
    },
    del: (endpoint) => {
        return window.API.request(endpoint, {
            method: 'DELETE'
        });
    },

    // Verificar si el usuario esta autenticado
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    // Obtener datos del usuario guardados en sesion
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    },

    // Cerrar sesion de forma local
    logoutLocal: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/index.html';
    }
};
