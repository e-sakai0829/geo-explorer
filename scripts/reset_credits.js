const https = require('https');

const supabaseUrl = "https://wpxmzrspzeoaarnoddgs.supabase.co";
const anonKey = "sb_publishable_XPmcMHPVuwMdDQL1Bi0MCw_KVYYk1VG";

// Supabase REST API で organizations の used_credits を 0 に更新
const data = JSON.stringify({ used_credits: 0 });

const req = https.request(`${supabaseUrl}/rest/v1/organizations?id=gt.00000000-0000-0000-0000-000000000000`, {
  method: 'PATCH',
  headers: {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response body:', body);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(data);
req.end();

