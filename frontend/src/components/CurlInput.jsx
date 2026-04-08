import { useState } from 'react';

const EXAMPLE_CURL = `curl -X POST https://api.example.com/v1/users \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your_token_here" \\
  -d '{"name": "Jane Doe", "email": "jane@example.com", "role": "admin"}'`;

export default function CurlInput({ onGenerate }) {
  const [curlText, setCurlText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [description, setDescription] = useState('');

  const handleParse = async () => {
    if (!curlText.trim()) return;
    setIsParsing(true);
    setParseError(null);
    setParsed(null);

    try {
      const res = await fetch('/api/parse-curl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curl: curlText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse');
      setParsed(data.apiDetails);
    } catch (e) {
      setParseError(e.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerate = () => {
    if (!parsed) return;
    onGenerate({ ...parsed, description });
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-300">Paste cURL Command</label>
          <button
            onClick={() => setCurlText(EXAMPLE_CURL)}
            className="text-xs text-blue-500 hover:text-blue-400 underline underline-offset-2"
          >
            Load example
          </button>
        </div>
        <textarea
          value={curlText}
          onChange={(e) => setCurlText(e.target.value)}
          rows={6}
          placeholder={EXAMPLE_CURL}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm font-mono text-slate-300 placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-colors resize-y"
          spellCheck={false}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleParse}
          disabled={!curlText.trim() || isParsing}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
        >
          {isParsing ? 'Parsing…' : 'Parse Command'}
        </button>
      </div>

      {parseError && (
        <p className="text-red-400 text-sm bg-red-950/30 border border-red-800 rounded-lg px-4 py-3">
          {parseError}
        </p>
      )}

      {parsed && (
        <div className="space-y-4">
          {/* Parsed preview */}
          <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parsed Request</p>
            <div className="flex items-center gap-3">
              <MethodBadge method={parsed.method} />
              <span className="text-sm font-mono text-slate-300 break-all">{parsed.url}</span>
            </div>

            {Object.keys(parsed.headers).length > 0 && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Headers</p>
                {Object.entries(parsed.headers).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs font-mono">
                    <span className="text-slate-500 shrink-0">{k}:</span>
                    <span className="text-slate-400 truncate">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {parsed.body && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Body</p>
                <pre className="text-xs font-mono text-slate-400 bg-slate-900 rounded p-2 overflow-x-auto scrollbar-thin">
                  {typeof parsed.body === 'string' ? parsed.body : JSON.stringify(parsed.body, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Endpoint Description <span className="text-slate-600">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Creates a new user account with the given details"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm transition-colors"
          >
            ⚡ Generate Test Cases
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
    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded shrink-0 ${colors[method] || 'bg-slate-800 text-slate-400'}`}>
      {method}
    </span>
  );
}
