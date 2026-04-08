const axios = require('axios');
const yaml = require('js-yaml');

async function parseSwaggerUrl(url) {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: { Accept: 'application/json, application/yaml, text/yaml, text/plain' },
  });

  let spec = response.data;

  // Parse YAML if needed
  if (typeof spec === 'string') {
    try {
      spec = yaml.load(spec);
    } catch {
      try {
        spec = JSON.parse(spec);
      } catch {
        throw new Error('Could not parse Swagger/OpenAPI spec as JSON or YAML');
      }
    }
  }

  const info = {
    title: spec.info?.title || 'API',
    version: spec.info?.version || '1.0',
    description: spec.info?.description || '',
    baseUrl: extractBaseUrl(spec),
    endpoints: [],
  };

  const paths = spec.paths || {};

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) continue;
      if (typeof operation !== 'object') continue;

      // Extract request body schema
      let requestBodySchema = null;
      if (operation.requestBody) {
        const content = operation.requestBody.content || {};
        const jsonContent = content['application/json'] || content['*/*'] || Object.values(content)[0];
        if (jsonContent?.schema) requestBodySchema = jsonContent.schema;
      }

      // Extract response schemas
      const responses = {};
      for (const [code, resp] of Object.entries(operation.responses || {})) {
        const content = resp.content || {};
        const jsonContent = content['application/json'] || Object.values(content)[0];
        responses[code] = {
          description: resp.description || '',
          schema: jsonContent?.schema || null,
        };
      }

      info.endpoints.push({
        method: method.toUpperCase(),
        path,
        summary: operation.summary || '',
        description: operation.description || '',
        operationId: operation.operationId || '',
        tags: operation.tags || [],
        parameters: operation.parameters || [],
        requestBody: requestBodySchema,
        responses,
        security: operation.security || spec.security || [],
      });
    }
  }

  return info;
}

function extractBaseUrl(spec) {
  // OpenAPI 3.x
  if (spec.servers && spec.servers.length > 0) {
    return spec.servers[0].url || '';
  }
  // Swagger 2.x
  if (spec.host) {
    const scheme = spec.schemes?.[0] || 'https';
    const basePath = spec.basePath || '';
    return `${scheme}://${spec.host}${basePath}`;
  }
  return '';
}

module.exports = { parseSwaggerUrl };
