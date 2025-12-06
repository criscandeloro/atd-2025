import http from 'k6/http';
import { BASE_URL } from './helpers/baseURL.js';

export function postCall(resource, payload, token = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return http.post(`${BASE_URL}${resource}`, JSON.stringify(payload), { headers });
}

// Exemplos esperados:
// postCall('/auth/login', payload)
// postCall('/auth/register', payload)
