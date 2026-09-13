const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '/home/soumya-patnaik/Desktop/iitbbsr-hackathon/iitbbsr/backend/.env' });

const secret = process.env.SUPABASE_JWT_SECRET;
const token = jwt.sign({
  sub: '11111111-1111-1111-1111-111111111111',
  role: 'authenticated',
  aud: 'authenticated',
  email: 'demo@questup.com'
}, secret, { expiresIn: '24h' });

console.log("TOKEN:", token);
