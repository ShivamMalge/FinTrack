import axios from 'axios';

async function test() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:4000/api', withCredentials: true });
    
    // Login
    const loginRes = await api.post('/auth/login', { email: 'admin@example.com', password: 'password123' });
    console.log('--- LOGIN RESPONSE ---');
    console.log(JSON.stringify(loginRes.data, null, 2));

    // Get cookie
    const cookies = loginRes.headers['set-cookie'];
    
    // Auth/me
    const meRes = await api.get('/auth/me', { headers: { Cookie: cookies } });
    console.log('--- AUTH/ME RESPONSE ---');
    console.log(JSON.stringify(meRes.data, null, 2));

  } catch (error) {
    console.error(error);
  }
}

test();
