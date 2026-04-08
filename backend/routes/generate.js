const express = require('express');
const router = express.Router();
const { generateTestCases } = require('../services/testGenerator');
const { parseSwaggerUrl } = require('../services/swaggerParser');
const { parseCurlCommand } = require('../services/curlParser');

// Parse a Swagger/OpenAPI URL and return structured endpoints
router.post('/parse-swagger', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    const result = await parseSwaggerUrl(url);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Parse a curl command into API details
router.post('/parse-curl', (req, res) => {
  try {
    const { curl } = req.body;
    if (!curl) return res.status(400).json({ error: 'curl command is required' });
    const apiDetails = parseCurlCommand(curl);
    res.json({ apiDetails });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate test cases — streams SSE back to client
router.post('/generate', async (req, res) => {
  const { apiDetails } = req.body;
  if (!apiDetails) {
    return res.status(400).json({ error: 'apiDetails is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    await generateTestCases(apiDetails, res);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
