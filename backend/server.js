require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const generateRouter = require('./routes/generate');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// In development allow the Vite dev server origin; in production same-origin so no CORS needed
if (!isProd) {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
    credentials: true,
  }));
}

app.use(express.json({ limit: '10mb' }));

app.use('/api', generateRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// In production, serve the built React frontend from frontend/dist
if (isProd) {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  // Return index.html for any non-API route (client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 APITestify running on http://localhost:${PORT} [${isProd ? 'production' : 'development'}]`);
  console.log(`   Anthropic API key: ${process.env.ANTHROPIC_API_KEY ? '✓ found' : '✗ missing (set ANTHROPIC_API_KEY)'}`);
});
