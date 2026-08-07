async function test() {
  try {
    const loginRes = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }) // We assume an admin exists
    });
    
    let cookies = loginRes.headers.get('set-cookie');
    
    if (!loginRes.ok) {
      console.log('Login failed, trying to register an admin...');
      const regRes = await fetch('http://localhost:4001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'password123', name: 'Admin' })
      });
      console.log('Register Res:', await regRes.json());
      // we need to set role to admin in db, but let's just log in and see what /auth/me returns
      const loginRes2 = await fetch('http://localhost:4001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
      });
      cookies = loginRes2.headers.get('set-cookie');
      console.log('--- LOGIN RESPONSE 2 ---', await loginRes2.json());
    } else {
      console.log('--- LOGIN RESPONSE ---');
      console.log(await loginRes.json());
    }

    // Auth/me
    const meRes = await fetch('http://localhost:4001/api/auth/me', {
      headers: { Cookie: cookies }
    });
    console.log('--- AUTH/ME RESPONSE ---');
    console.log(await meRes.json());

  } catch (error) {
    console.error(error);
  }
}

test();
