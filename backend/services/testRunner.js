const axios = require('axios');

async function runTests(testCases, baseUrl) {
  const results = [];

  for (const tc of testCases) {
    const start = Date.now();
    const result = {
      id: tc.id,
      name: tc.name,
      passed: false,
      actualStatus: null,
      expectedStatus: tc.expectedResponse?.statusCode,
      responseTime: null,
      error: null,
    };

    try {
      let url = tc.request.url || '';

      // If URL is relative or missing host, prepend baseUrl
      if (baseUrl && !url.match(/^https?:\/\//)) {
        const base = baseUrl.replace(/\/$/, '');
        url = base + (url.startsWith('/') ? url : '/' + url);
      }

      const response = await axios({
        method: (tc.request.method || 'GET').toLowerCase(),
        url,
        headers: tc.request.headers || {},
        params: tc.request.queryParams || {},
        data: tc.request.body !== null && tc.request.body !== undefined ? tc.request.body : undefined,
        timeout: 10000,
        validateStatus: () => true, // never throw on HTTP error status
      });

      result.actualStatus = response.status;
      result.responseTime = Date.now() - start;
      result.passed = response.status === result.expectedStatus;
    } catch (err) {
      result.error = err.code === 'ECONNABORTED' ? 'Timeout (10s)' : err.message;
      result.responseTime = Date.now() - start;
    }

    results.push(result);
  }

  return results;
}

module.exports = { runTests };
