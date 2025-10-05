import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// CORS setup for API routes
const allowedOrigins = [
  'https://jits-planner-pro.vercel.app',  // Your Vercel frontend URL
  'https://jitsplannerpro.onrender.com',  // Your Render backend URL (optional)
  'http://localhost:5173',                 // For local dev
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

// API routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  // TODO: Replace with your real auth logic
  if (email === 'test@example.com' && password === 'password') {
    return res.json({ user: { id: 1, email } });
  } else {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Add other API routes here...

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