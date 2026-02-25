const jwt = require('jsonwebtoken');
const fs = require('fs');

// 1. Replace this with the exact name of the .p8 file you downloaded
const privateKey = fs.readFileSync('./AuthKey_9HTC5L22G5.p8'); 

// 2. Your Apple Details
const teamId = '3F6HFR6XWL';
const keyId = '9HTC5L22G5';
const clientId = 'com.vimciety.app.web';

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d', // Apple's maximum allowed time (6 months)
  audience: 'https://appleid.apple.com',
  issuer: teamId,
  subject: clientId,
  keyid: keyId,
});

console.log('\n✅ COPY THIS ENTIRE STRING INTO SUPABASE:');
console.log(token);
console.log('\n');