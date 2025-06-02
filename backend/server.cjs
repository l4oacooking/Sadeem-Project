require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if input is an email or a store_id (simple check)
  const isEmail = email.includes('@');
  let query;
  if (isEmail) {
    query = supabase
      .from('admins')
      .select('id, store_id, email, password, role')
      .eq('email', email)
      .maybeSingle();
  } else {
    query = supabase
      .from('admins')
      .select('id, store_id, email, password, role')
      .eq('store_id', email)
      .eq('role', 'owner')
      .maybeSingle();
  }
  const { data: admin, error } = await query;

  if (error || !admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, admin.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  // Create JWT with store_id claim
  const token = jwt.sign(
    {
      sub: admin.id,
      store_id: admin.store_id,
      role: admin.role,
      email: admin.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { store_id: admin.store_id, role: admin.role, email: admin.email }
  });
});

// Just for testing: verify JWT (optional)
app.get('/profile', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json(decoded);
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.listen(4000, () => console.log('Backend running on port 4000'));
