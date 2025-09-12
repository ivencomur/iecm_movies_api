const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login endpoint directly...');
    
    const response = await axios.post('http://localhost:8080/login', {
      username: 'testuser',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();