const axios = require('axios');
const yaml = require('js-yaml');

function resolveRef(ref, rootSpec) {
  if (!ref || !ref.startsWith('#/')) return {};
  const parts = ref.slice(2).split('/');
  let node = rootSpec;
  for (const part of parts) {
    // JSON Pointer unescaping
    node = node?.[part.replace(/~1/g, '/').replace(/~0/g, '~')];
    if (node === undefined) return {};
  }
  return node;
}

function deepResolve(schema, rootSpec, depth = 0) {
  if (depth > 6 || schema === null || schema === undefined) return schema;
  if (typeof schema !== 'object') return schema;
  if (Array.isArray(schema)) return schema.map((s) => deepResolve(s, rootSpec, depth));
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, rootSpec);
    return deepResolve(resolved, rootSpec, depth + 1);
  }
  const out = {};
  for (const [k, v] of Object.entries(schema)) {
    out[k] = deepResolve(v, rootSpec, depth + 1);
  }
  return out;
}

async function parseSwaggerUrl(url) {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: { Accept: 'application/json, application/yaml, text/yaml, text/plain' },
  });

  let spec = response.data;

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
    // Pass a compact version of the spec for AI context (large specs get truncated in formatApiDetails)
    spec: compactSpec(spec),
  };

  const paths = spec.paths || {};

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) continue;
      if (typeof operation !== 'object') continue;

      let requestBodySchema = null;
      if (operation.requestBody) {
        const content = operation.requestBody.content || {};
        const jsonContent = content['application/json'] || content['*/*'] || Object.values(content)[0];
        if (jsonContent?.schema) {
          requestBodySchema = deepResolve(jsonContent.schema, spec);
        }
      }

      const responses = {};
      for (const [code, resp] of Object.entries(operation.responses || {})) {
        const content = resp.content || {};
        const jsonContent = content['application/json'] || Object.values(content)[0];
        responses[code] = {
          description: resp.description || '',
          schema: jsonContent?.schema ? deepResolve(jsonContent.schema, spec) : null,
        };
      }

      const parameters = (operation.parameters || []).map((p) => deepResolve(p, spec));

      info.endpoints.push({
        method: method.toUpperCase(),
        path,
        summary: operation.summary || '',
        description: operation.description || '',
        operationId: operation.operationId || '',
        tags: operation.tags || [],
        parameters,
        requestBody: requestBodySchema,
        responses,
        security: operation.security || spec.security || [],
      });
    }
  }

  return info;
}

function extractBaseUrl(spec) {
  if (spec.servers?.length > 0) return spec.servers[0].url || '';
  if (spec.host) {
    const scheme = spec.schemes?.[0] || 'https';
    const basePath = spec.basePath || '';
    return `${scheme}://${spec.host}${basePath}`;
  }
  return '';
}

// Return a trimmed spec object that has schemas/definitions but strips the full paths detail
// (endpoints are already extracted above; this gives the AI type definitions context)
function compactSpec(spec) {
  const compact = {};
  if (spec.info) compact.info = spec.info;
  if (spec.components?.schemas) compact.schemas = spec.components.schemas;
  if (spec.definitions) compact.definitions = spec.definitions;
  if (spec.securityDefinitions) compact.securityDefinitions = spec.securityDefinitions;
  if (spec.components?.securitySchemes) compact.securitySchemes = spec.components.securitySchemes;
  return compact;
}

module.exports = { parseSwaggerUrl };
