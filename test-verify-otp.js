const http = require('http');

const data = JSON.stringify({ email: 'info@digitalbrokerage.sa', otp: '123456' });
const req = http.request({
  hostname: 'localhost',
  port: 3030,
  path: '/api/auth/verify-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(res.statusCode, body));
});
req.on('error', console.error);
req.write(data);
req.end();
