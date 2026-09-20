const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const openssl = 'C:\\Program Files\\Git\\usr\\bin\\openssl.exe';
const certDir = path.join(__dirname, 'test_certs');
if (!fs.existsSync(certDir)) fs.mkdirSync(certDir);

process.chdir(certDir);

// 1. Generate CA
execSync(`"${openssl}" req -x509 -newkey rsa:2048 -nodes -keyout test_ca.key -out test_ca.crt -days 365 -subj "/CN=TestSafeFetchCA"`);

// 2. Generate Server Cert for valid.example.com
execSync(`"${openssl}" req -newkey rsa:2048 -nodes -keyout test_server.key -out test_server.csr -subj "/CN=valid.example.com"`);
fs.writeFileSync('ext_valid.cnf', 'subjectAltName=DNS:valid.example.com\n');
execSync(`"${openssl}" x509 -req -in test_server.csr -CA test_ca.crt -CAkey test_ca.key -CAcreateserial -out test_server_valid.crt -days 365 -extfile ext_valid.cnf`);

// 3. Generate Server Cert for wrong.example.com
execSync(`"${openssl}" req -newkey rsa:2048 -nodes -keyout test_wrong.key -out test_wrong.csr -subj "/CN=wrong.example.com"`);
fs.writeFileSync('ext_wrong.cnf', 'subjectAltName=DNS:wrong.example.com\n');
execSync(`"${openssl}" x509 -req -in test_wrong.csr -CA test_ca.crt -CAkey test_ca.key -CAcreateserial -out test_server_wrong.crt -days 365 -extfile ext_wrong.cnf`);

console.log('Certificates generated successfully in test_certs!');
