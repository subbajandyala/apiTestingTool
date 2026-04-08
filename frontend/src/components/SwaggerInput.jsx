import { useState } from 'react';

const EXAMPLES = [
  { label: 'Petstore', url: 'https://petstore.swagger.io/v2/swagger.json' },
  { label: 'JSONPlaceholder (mock)', url: '' },
];

export default function SwaggerInput({ onGenerate }) {
  const [url, setUrl] = useState('');
  const [endpoints, setEndpoints] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [specInfo, setSpecInfo] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setIsFetching(true);
    setFetchError(null);
    setEndpoints(null);
    setSelectedEndpoint(null);

    try {
      const res = await fetch('/api/parse-swagger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setSpecInfo(data);
      setEndpoints(data.endpoints);
    } catch (e) {
      setFetchError(e.message);
    } finally {
      setIsFetching(false);
    }
  };

  const handleGenerate = () => {
    if (!selectedEndpoint) return;
    const ep = endpoints[selectedEndpoint];
    onGenerate({
      method: ep.method,
      url: (specInfo.baseUrl || '') + ep.path,
      description: ep.summary || ep.description,
      headers: {},
      queryParams: {},
      body: ep.requestBody ? JSON.stringify(ep.requestBody, null, 2) : null,
      parameters: ep.parameters,
      responses: ep.responses,
      auth: ep.security?.length > 0 ? 'Required (see security schemes)' : null,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Swagger / OpenAPI URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            placeholder="https://api.example.com/swagger.json"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={handleFetch}
            disabled={!url.trim() || isFetching}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {isFetching ? 'Loading…' : 'Fetch Spec'}
          </button>
        </div>

        {/* Quick examples */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-slate-600">Try:</span>
          <button
            onClick={() => setUrl('https://petstore.swagger.io/v2/swagger.json')}
            className="text-xs text-blue-500 hover:text-blue-400 underline underline-offset-2"
          >
            Petstore
          </button>
        </div>
      </div>

      {fetchError && (
        <p className="text-red-400 text-sm bg-red-950/30 border border-red-800 rounded-lg px-4 py-3">
          {fetchError}
        </p>
      )}

      {specInfo && endpoints && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg">
            <span className="text-emerald-400 text-lg">✓</span>
            <div>
              <p className="text-sm font-medium text-emerald-300">
                {specInfo.title} v{specInfo.version}
              </p>
              <p className="text-xs text-slate-500">{endpoints.length} endpoints found</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select an Endpoint
            </label>
            <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-1">
              {endpoints.map((ep, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedEndpoint(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    selectedEndpoint === i
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <MethodBadge method={ep.method} />
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-slate-200 truncate">{ep.path}</p>
                    {ep.summary && (
                      <p className="text-xs text-slate-500 truncate">{ep.summary}</p>
                    )}
                  </div>
                  {ep.tags?.length > 0 && (
                    <span className="ml-auto text-xs text-slate-600 shrink-0">{ep.tags[0]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={selectedEndpoint === null}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-colors"
          >
            {selectedEndpoint === null ? 'Select an endpoint above' : '⚡ Generate Test Cases'}
          </button>
        </div>
      )}
    </div>
  );
}

function MethodBadge({ method }) {
  const colors = {
    GET: 'bg-emerald-900/50 text-emerald-400',
    POST: 'bg-blue-900/50 text-blue-400',
    PUT: 'bg-amber-900/50 text-amber-400',
    PATCH: 'bg-purple-900/50 text-purple-400',
    DELETE: 'bg-red-900/50 text-red-400',
  };
  return (
    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 ${colors[method] || 'bg-slate-800 text-slate-400'}`}>
      {method}
    </span>
  );
}
