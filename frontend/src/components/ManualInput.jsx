import { useState } from 'react';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const METHOD_COLORS = {
  GET: 'text-emerald-400',
  POST: 'text-blue-400',
  PUT: 'text-amber-400',
  PATCH: 'text-purple-400',
  DELETE: 'text-red-400',
  HEAD: 'text-slate-400',
  OPTIONS: 'text-slate-400',
};

function KeyValueEditor({ label, pairs, onChange }) {
  const add = () => onChange([...pairs, { key: '', value: '' }]);
  const remove = (i) => onChange(pairs.filter((_, idx) => idx !== i));
  const update = (i, field, val) => {
    const next = [...pairs];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <button
          type="button"
          onClick={add}
          className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
        >
          + Add
        </button>
      </div>
      {pairs.length === 0 && (
        <p className="text-xs text-slate-600 italic">No {label.toLowerCase()} — click + Add</p>
      )}
      {pairs.map((pair, i) => (
        <div key={i} className="flex gap-2">
          <input
            placeholder="Key"
            value={pair.key}
            onChange={(e) => update(i, 'key', e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
          />
          <input
            placeholder="Value"
            value={pair.value}
            onChange={(e) => update(i, 'value', e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="w-8 h-9 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default function ManualInput({ onGenerate }) {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('headers');
  const [headers, setHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  const [queryParams, setQueryParams] = useState([]);
  const [authType, setAuthType] = useState('none');
  const [authValue, setAuthValue] = useState('');
  const [bodyType, setBodyType] = useState('json');
  const [bodyText, setBodyText] = useState('');
  const [bodyError, setBodyError] = useState('');

  const SUB_TABS = [
    { id: 'headers', label: 'Headers', badge: headers.filter((h) => h.key).length },
    { id: 'params', label: 'Params', badge: queryParams.filter((p) => p.key).length },
    { id: 'auth', label: 'Auth', badge: authType !== 'none' ? 1 : 0 },
    { id: 'body', label: 'Body', badge: bodyText ? 1 : 0 },
  ];

  const validateBody = (text) => {
    if (!text.trim()) { setBodyError(''); return; }
    if (bodyType === 'json') {
      try { JSON.parse(text); setBodyError(''); }
      catch { setBodyError('Invalid JSON'); }
    } else {
      setBodyError('');
    }
  };

  const toObject = (pairs) =>
    Object.fromEntries(pairs.filter((p) => p.key).map((p) => [p.key, p.value]));

  const handleGenerate = () => {
    if (!url.trim()) return;

    let body = null;
    if (bodyText.trim()) {
      try { body = JSON.parse(bodyText); }
      catch { body = bodyText; }
    }

    const allHeaders = toObject(headers);
    let auth = null;
    if (authType === 'bearer' && authValue) {
      allHeaders['Authorization'] = `Bearer ${authValue}`;
      auth = `Bearer ${authValue}`;
    } else if (authType === 'apikey' && authValue) {
      allHeaders['X-API-Key'] = authValue;
      auth = `API Key: ${authValue}`;
    } else if (authType === 'basic' && authValue) {
      allHeaders['Authorization'] = `Basic ${btoa(authValue)}`;
      auth = 'Basic auth';
    }

    onGenerate({
      method,
      url,
      description,
      headers: allHeaders,
      queryParams: toObject(queryParams),
      body,
      auth,
    });
  };

  const canGenerate = url.trim() && !bodyError;

  return (
    <div className="space-y-5">
      {/* Method + URL */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Request</label>
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={`bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer ${METHOD_COLORS[method]}`}
          >
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m} className="text-white bg-slate-900">
                {m}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/v1/users/{id}"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Description <span className="text-slate-600">(optional but improves results)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Retrieves a paginated list of users with optional role filter"
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Sub-tabs */}
      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                activeSubTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-500 -mb-px bg-slate-900'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeSubTab === 'headers' && (
            <KeyValueEditor label="Headers" pairs={headers} onChange={setHeaders} />
          )}

          {activeSubTab === 'params' && (
            <KeyValueEditor label="Query Parameters" pairs={queryParams} onChange={setQueryParams} />
          )}

          {activeSubTab === 'auth' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Auth Type</label>
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="apikey">API Key</option>
                  <option value="basic">Basic Auth (user:pass)</option>
                </select>
              </div>
              {authType !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {authType === 'bearer' ? 'Token' : authType === 'apikey' ? 'API Key Value' : 'username:password'}
                  </label>
                  <input
                    type="text"
                    value={authValue}
                    onChange={(e) => setAuthValue(e.target.value)}
                    placeholder={authType === 'basic' ? 'username:password' : 'your_token_here'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'body' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {['json', 'form', 'text'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setBodyType(t)}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                      bodyType === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="relative">
                <textarea
                  value={bodyText}
                  onChange={(e) => { setBodyText(e.target.value); validateBody(e.target.value); }}
                  rows={8}
                  placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body here…'}
                  className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-sm font-mono text-slate-300 placeholder-slate-700 focus:outline-none transition-colors resize-y ${
                    bodyError ? 'border-red-700' : 'border-slate-700 focus:border-blue-500'
                  }`}
                  spellCheck={false}
                />
                {bodyError && (
                  <p className="absolute right-3 bottom-3 text-xs text-red-400">{bodyError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-colors"
      >
        {canGenerate ? '⚡ Generate Test Cases' : 'Enter a URL to continue'}
      </button>
    </div>
  );
}
