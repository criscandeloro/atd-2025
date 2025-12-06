import http from 'k6/http';
import { check, group } from 'k6';
import { randomString } from './randomData.js';

// Note: Assumes BASE_URL is passed from the main script
// or defined as a global environment variable.

export function registerUser(baseUrl) {
  const uniqueId = `${__VU}-${__ITER}-${randomString()}`;
  const user = {
    email: `user_${uniqueId}@example.com`,
    password: 'password123',
    name: `Test User ${__VU}-${__ITER}`,
  };

  group('User Registration', function () {
    const payload = JSON.stringify({
      email: user.email,
      password: user.password,
      name: user.name,
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    const res = http.post(`${baseUrl}/auth/register`, payload, params);

    const isSuccess = check(res, {
      'registration status is 201': (r) => r.status === 201,
    });

    if (!isSuccess) {
        console.error(`Registration failed for user ${user.email}: ${res.status} ${res.body}`);
        return null;
    }
  });

  return user;
}

export function loginUser(baseUrl, user) {
  let authToken = '';

  group('User Login', function () {
    const payload = JSON.stringify({
      email: user.email,
      password: user.password,
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    const res = http.post(`${baseUrl}/auth/login`, payload, params);

    const isSuccess = check(res, {
      'login status is 200': (r) => r.status === 200,
    });

    if (isSuccess) {
      authToken = res.json('data.token');
    } else {
        console.error(`Login failed for user ${user.email}: ${res.status} ${res.body}`);
        return null;
    }
  });

  return authToken;
}
