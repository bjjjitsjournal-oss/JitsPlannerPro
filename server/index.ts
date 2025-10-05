import express from 'express';
import cors from 'cors';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// CORS setup for API routes
const allowedOrigins = [
  'https://jits-planner-pro.vercel.app',
  'https://jitsplannerpro.onrender.com',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Initialize Supabase client with service role key (server-side)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// API route: signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email confirmation for now
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ user: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// API route: login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return res.status(401).json({ error: error?.message || 'Invalid credentials' });
    }

    return res.json({ user: data.user });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve frontend static files from Vite build output
const publicPath = path.join(process.cwd(), 'dist', 'public');
app.use(express.static(publicPath));

// SPA fallback: serve index.html for any unknown route (for React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start server
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`[express] Server listening on port ${port}`);
});