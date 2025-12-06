import http from 'k6/http';
import { sleep, group, check } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 20 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(90)<=2000', 'p(95)<5000'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  group('User Registration', () => {
    const url = 'http://localhost:3000/auth/register';
    const userEmail = `user_${__VU}_${__ITER}_${new Date().getTime()}@example.com`;
    const userName = `User ${__VU} ${__ITER}`;

    const payload = JSON.stringify({
      email: userEmail,
      password: 'password123',
      name: userName,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const res = http.post(url, payload, params);

    const isSuccess = check(res, {
      'Registration: status is 201': (r) => r.status === 201,
    });

    if (!isSuccess && res.status !== 201) {
      console.log(`Registration failed. Status: ${res.status}, Body: ${res.body}`);
    }
  });

  group('User Login', () => {
    const res = http.post(
      'http://localhost:3000/auth/login',
      JSON.stringify({
        email: "teste@teste.com.br",
        password: "password123"
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    check(res, {
        'Login: status is 200': (r) => r.status === 200,
    });
  });

  // Think time between iterations
  sleep(1);
}
