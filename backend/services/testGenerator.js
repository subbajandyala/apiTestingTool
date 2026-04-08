const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

function formatApiDetails(apiDetails) {
  const parts = [];

  if (apiDetails.method && apiDetails.url) {
    parts.push(`Endpoint: ${apiDetails.method.toUpperCase()} ${apiDetails.url}`);
  }

  if (apiDetails.description) {
    parts.push(`Description: ${apiDetails.description}`);
  }

  if (apiDetails.baseUrl) {
    parts.push(`Base URL: ${apiDetails.baseUrl}`);
  }

  if (apiDetails.headers && Object.keys(apiDetails.headers).length > 0) {
    parts.push('Headers:');
    for (const [k, v] of Object.entries(apiDetails.headers)) {
      parts.push(`  ${k}: ${v}`);
    }
  }

  if (apiDetails.queryParams && Object.keys(apiDetails.queryParams).length > 0) {
    parts.push('Query Parameters:');
    for (const [k, v] of Object.entries(apiDetails.queryParams)) {
      parts.push(`  ${k}: ${v}`);
    }
  }

  if (apiDetails.pathParams && Object.keys(apiDetails.pathParams).length > 0) {
    parts.push('Path Parameters:');
    for (const [k, v] of Object.entries(apiDetails.pathParams)) {
      parts.push(`  ${k}: ${v} (example)`);
    }
  }

  if (apiDetails.auth) {
    parts.push(`Authentication: ${apiDetails.auth}`);
  }

  if (apiDetails.body !== null && apiDetails.body !== undefined && apiDetails.body !== '') {
    parts.push('Request Body:');
    const bodyStr = typeof apiDetails.body === 'string'
      ? apiDetails.body
      : JSON.stringify(apiDetails.body, null, 2);
    parts.push(bodyStr);
  }

  if (apiDetails.parameters && apiDetails.parameters.length > 0) {
    parts.push('Parameters Schema:');
    parts.push(JSON.stringify(apiDetails.parameters, null, 2));
  }

  if (apiDetails.responses && Object.keys(apiDetails.responses).length > 0) {
    parts.push('Defined Responses:');
    parts.push(JSON.stringify(apiDetails.responses, null, 2).substring(0, 2000));
  }

  // Include swagger spec if it was provided (truncated)
  if (apiDetails.swaggerSpec) {
    const specStr = JSON.stringify(apiDetails.swaggerSpec, null, 2);
    parts.push('OpenAPI/Swagger Specification (excerpt):');
    parts.push(specStr.substring(0, 6000));
  }

  return parts.join('\n');
}

async function generateTestCases(apiDetails, res) {
  const formattedDetails = formatApiDetails(apiDetails);

  const prompt = `You are a senior QA engineer and API testing expert. Analyze the API endpoint below and generate comprehensive test cases covering every important testing scenario.

API DETAILS:
${formattedDetails}

INSTRUCTIONS:
- Generate 15-25 test cases depending on API complexity
- Cover all categories: Happy Path, Authentication, Validation, Error Handling, Security, Edge Cases
- Be specific — use realistic values for request bodies, headers, and parameters
- For the URL field in each test case, substitute any path params with realistic example values (e.g. /users/123 not /users/{id})
- Return ONLY valid JSON — no markdown, no code fences, no commentary before or after

JSON FORMAT (return exactly this structure):
{
  "summary": {
    "endpoint": "<METHOD /path>",
    "totalTests": <number>,
    "categories": {
      "Happy Path": <count>,
      "Authentication": <count>,
      "Validation": <count>,
      "Error Handling": <count>,
      "Security": <count>,
      "Edge Cases": <count>
    }
  },
  "testCases": [
    {
      "id": "TC001",
      "name": "<short descriptive test name>",
      "category": "Happy Path",
      "priority": "High",
      "description": "<what this test verifies and why it matters>",
      "request": {
        "method": "<HTTP METHOD>",
        "url": "<full URL with concrete path param values>",
        "headers": { "<key>": "<value>" },
        "queryParams": { "<key>": "<value>" },
        "body": <JSON object or null>
      },
      "expectedResponse": {
        "statusCode": <number>,
        "description": "<what the response should look like>",
        "assertions": [
          "<assertion 1>",
          "<assertion 2>",
          "<assertion 3>"
        ]
      },
      "notes": "<optional setup steps, test data requirements, or caveats>"
    }
  ]
}

Categories to cover:
1. Happy Path — valid inputs, successful operations
2. Authentication — missing token, invalid token, expired token, wrong permissions
3. Validation — missing required fields, wrong types, invalid formats, out-of-range values
4. Error Handling — non-existent resources, malformed requests, server errors
5. Security — SQL injection, XSS payloads, IDOR attempts, oversized payloads
6. Edge Cases — empty strings, null values, boundary numbers, special characters, unicode`;

  let fullText = '';

  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 64000,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullText += event.delta.text;
      // Send progress heartbeat every ~200 chars so client knows we're alive
      if (fullText.length % 200 < event.delta.text.length) {
        res.write(`data: ${JSON.stringify({ progress: fullText.length })}\n\n`);
      }
    }
  }

  // Try to extract and validate JSON before sending
  let parsed = null;
  try {
    parsed = JSON.parse(fullText.trim());
  } catch {
    // Strip markdown code fences if Claude added them
    const m = fullText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) {
      try { parsed = JSON.parse(m[1].trim()); } catch {}
    }
    // Fallback: grab the outermost {...}
    if (!parsed) {
      const m2 = fullText.match(/(\{[\s\S]*\})/);
      if (m2) {
        try { parsed = JSON.parse(m2[1]); } catch {}
      }
    }
  }

  if (parsed) {
    res.write(`data: ${JSON.stringify({ done: true, result: parsed })}\n\n`);
  } else {
    res.write(`data: ${JSON.stringify({ error: 'Could not parse AI response as JSON. Please try again.' })}\n\n`);
  }

  res.end();
}

module.exports = { generateTestCases };
