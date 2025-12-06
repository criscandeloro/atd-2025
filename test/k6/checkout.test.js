import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { randomString } from '../helpers/randomData.js';


export const options = {
  vus: 10,
  duration: '15s',
  thresholds: {
    'http_req_duration': ['p(95) < 2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Ensure registration is successful before proceeding
  const user = registerUser();
  if (!user) {
    return; // Stop this iteration if registration failed
  }

  // Login with the registered user
  const authToken = loginUser(user);
  if (!authToken) {
    return; // Stop this iteration if login failed
  }

  // Create a product
  const productId = createProduct(authToken);
  if (!productId) {
    return; // Stop this iteration if product creation failed
  }

  // Perform checkout
  checkout(authToken, productId);

  sleep(1);
}



function registerUser() {
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

    const res = http.post(`${BASE_URL}/auth/register`, payload, params);

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

function loginUser(user) {
  let authToken = '';

  group('User Login', function () {
    const payload = JSON.stringify({
      email: user.email,
      password: user.password,
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    const res = http.post(`${BASE_URL}/auth/login`, payload, params);

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

function createProduct(authToken) {
  let productId = null;

  group('Create Product', function () {
    const productPayload = JSON.stringify({
        name: `Test Product ${__VU}-${__ITER}`,
        description: 'A product for testing',
        price: 10,
        stock: 100
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    };

    const res = http.post(`${BASE_URL}/products`, productPayload, params);

    const isSuccess = check(res, {
      'product creation status is 201': (r) => r.status === 201,
    });
    
    if (isSuccess) {
        productId = res.json('data.id');
    } else {
        console.error(`Product creation failed: ${res.status} ${res.body}`);
        return null;
    }
  });
  
  return productId;
}

function checkout(authToken, productId) {
  group('Checkout', function () {
    const payload = JSON.stringify({
      items: [{ productId: productId, quantity: 1 }],
      paymentMethod: 'cash',
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    };

    const res = http.post(`${BASE_URL}/checkout`, payload, params);

    check(res, {
      'checkout status is 200': (r) => r.status === 200,
    });
  });
}
