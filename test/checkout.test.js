import { group, check, sleep } from 'k6';
import { postCall } from '../helpers/apiCalls.js';
import { loginUser } from '../helpers/login.js';
import { randomString } from '../helpers/randomData.js';cd

export const options = {
    vus: 10,
    duration: '15s',
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 2 segundos
    },
};

export default function () {

    const randomEmail = `user_${randomString()}@test.com`;
    const randomPassword = `pass_${randomString()}`;

    let token;

    group('Registrar usuário', () => {
        const payload = {
            email: randomEmail,
            password: randomPassword,
            name: "Test User"
        };

        const res = postCall('/auth/register', payload);

        check(res, {
            'status 201 ao registrar': (r) => r.status === 201 || r.status === 200
        });
    });

    group('Login do usuário', () => {
        token = loginUser(randomEmail, randomPassword);

        check(token, {
            'token JWT recebido': (t) => t && t.length > 10
        });
    });

    group('Realizar checkout', () => {
        const payload = {
            productId: 1,
            quantity: 1,
            paymentMethod: "cash"
        };

        const res = postCall('/checkout', payload, token);

        check(res, {
            'checkout status 200': (r) => r.status === 200
        });
    });

    sleep(1);
}
