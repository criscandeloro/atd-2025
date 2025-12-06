import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import faker from 'k6/x/faker';

import getBaseUrl from './helpers/baseUrl.js';
import { randomEmail } from './helpers/email.js';
import { login } from './helpers/login.js';

const baseUrl = getBaseUrl();

const checkoutTrend = new Trend('checkout_duration');

export const options = {
  vus: 10,
  duration: '15s',
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% das requisições devem ser abaixo de 2s
    'checks': ['rate>0.99'], // 99% dos checks devem passar
  },
};

export default function () {
  const user = {
    email: randomEmail(),
    password: faker.internet.password(),
    name: faker.person.firstName(),
  };

  group('1. User Registration', () => {
    const payload = JSON.stringify(user);
    const params = { headers: { 'Content-Type': 'application/json' } };

    const res = http.post(`${baseUrl}/auth/register`, payload, params);

    check(res, {
      'registration response received': (r) => r,
      'registration successful (status 201)': (r) => r && r.status === 201,
    });
  });

  sleep(1);

  const authToken = login(baseUrl, user);

  if (!authToken) {
    return; // Aborta a iteração se o login falhar e não retornar um token
  }

  sleep(1);

  group('3. Checkout', () => {
    const payload = JSON.stringify({
      items: [{ productId: 1, quantity: 1 }],
      paymentMethod: 'cash',
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    };

    const res = http.post(`${baseUrl}/checkout`, payload, params);
    checkoutTrend.add(res.timings.duration);

    check(res, {
      'checkout response received': (r) => r,
      'checkout successful (status 200)': (r) => r && r.status === 200,
    });
  });
}