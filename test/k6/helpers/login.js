import http from 'k6/http';
import { check } from 'k6';

export function login(baseUrl, user) {
  const payload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  const params = { headers: { 'Content-Type': 'application/json' } };

  const res = http.post(`${baseUrl}/auth/login`, payload, params);

  check(res, {
    'login response received': (r) => r,
    'login successful (status 200)': (r) => r && r.status === 200,
    'auth token is present': (r) => r && r.json('data.token') !== '',
  });

  return res ? res.json('data.token') : '';
}