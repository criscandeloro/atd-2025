import { postCall } from './apiCalls.js';

export function loginUser(email, password) {
    const payload = {
        email: email,
        password: password
    };

    const res = postCall('/auth/login', payload);

    if (res.status !== 200 || !res.json('data.token')) {
        throw new Error("Falha ao fazer login. Verifique os dados enviados.");
    }

    return res.json('data.token');
}
