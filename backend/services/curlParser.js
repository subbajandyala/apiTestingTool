/**
 * Parses a curl command string into structured API details.
 * Supports: -X, -H, -d/--data/--data-raw/--data-binary, -u, --user, -b, --cookie
 */
function parseCurlCommand(curlString) {
  // Normalise line continuations and collapse whitespace
  const curl = curlString
    .replace(/\\\r?\n/g, ' ')
    .replace(/\r?\n/g, ' ')
    .trim();

  const result = {
    method: 'GET',
    url: '',
    headers: {},
    queryParams: {},
    body: null,
    auth: null,
  };

  // Tokenise respecting single/double-quoted strings
  const tokens = tokenize(curl);

  // The first token is 'curl', skip it
  let i = 1;
  while (i < tokens.length) {
    const tok = tokens[i];

    if (tok === '-X' || tok === '--request') {
      result.method = (tokens[++i] || 'GET').toUpperCase();
    } else if (tok === '-H' || tok === '--header') {
      const header = tokens[++i] || '';
      const colonIdx = header.indexOf(':');
      if (colonIdx !== -1) {
        const name = header.slice(0, colonIdx).trim();
        const value = header.slice(colonIdx + 1).trim();
        result.headers[name] = value;
        if (name.toLowerCase() === 'authorization') {
          result.auth = value;
        }
      }
    } else if (['-d', '--data', '--data-raw', '--data-binary', '--data-urlencode'].includes(tok)) {
      const raw = tokens[++i] || '';
      try {
        result.body = JSON.parse(raw);
      } catch {
        result.body = raw;
      }
      // Default to POST if method not explicitly set
      if (result.method === 'GET') result.method = 'POST';
    } else if (tok === '-u' || tok === '--user') {
      const cred = tokens[++i] || '';
      result.auth = `Basic ${Buffer.from(cred).toString('base64')}`;
      result.headers['Authorization'] = result.auth;
    } else if (tok === '-b' || tok === '--cookie') {
      result.headers['Cookie'] = tokens[++i] || '';
    } else if (!tok.startsWith('-')) {
      // Likely the URL
      if (!result.url) {
        try {
          const urlObj = new URL(tok);
          result.url = urlObj.origin + urlObj.pathname;
          urlObj.searchParams.forEach((v, k) => { result.queryParams[k] = v; });
        } catch {
          result.url = tok;
        }
      }
    }
    i++;
  }

  // Infer Content-Type if body is an object
  if (result.body && typeof result.body === 'object' && !result.headers['Content-Type']) {
    result.headers['Content-Type'] = 'application/json';
  }

  return result;
}

/** Very small shell-like tokeniser that respects single/double quotes. */
function tokenize(str) {
  const tokens = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (ch === ' ' && !inSingle && !inDouble) {
      if (current) { tokens.push(current); current = ''; }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

module.exports = { parseCurlCommand };
