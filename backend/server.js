require('dotenv').config();
const express = require('express');
const cors = require('cors');
const generateRouter = require('./routes/generate');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api', generateRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API Test Generator backend running on http://localhost:${PORT}`);
  console.log(`   Anthropic API key: ${process.env.ANTHROPIC_API_KEY ? '✓ found' : '✗ missing (set ANTHROPIC_API_KEY)'}`);
});
