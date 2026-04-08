import { useState } from 'react';

const PRIORITY_COLORS = {
  High:   'bg-red-900/50 text-red-300',
  Medium: 'bg-amber-900/50 text-amber-300',
  Low:    'bg-slate-800 text-slate-400',
};

const METHOD_COLORS = {
  GET:     'bg-emerald-900/50 text-emerald-400',
  POST:    'bg-blue-900/50 text-blue-400',
  PUT:     'bg-amber-900/50 text-amber-400',
  PATCH:   'bg-purple-900/50 text-purple-400',
  DELETE:  'bg-red-900/50 text-red-400',
};

const STATUS_COLORS = {
  2: 'text-emerald-400',
  3: 'text-blue-400',
  4: 'text-amber-400',
  5: 'text-red-400',
};

function statusColor(code) {
  const prefix = Math.floor(code / 100);
  return STATUS_COLORS[prefix] || 'text-slate-400';
}

export default function TestCaseCard({ testCase: tc, categoryMeta }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasBody = tc.request.body !== null && tc.request.body !== undefined;
  const hasHeaders = tc.request.headers && Object.keys(tc.request.headers).length > 0;
  const hasParams = tc.request.queryParams && Object.keys(tc.request.queryParams).length > 0;

  const copyAsCurl = () => {
    const lines = [`curl -X ${tc.request.method} "${tc.request.url}"`];
    if (hasHeaders) {
      for (const [k, v] of Object.entries(tc.request.headers)) {
        lines.push(`  -H "${k}: ${v}"`);
      }
    }
    if (hasBody) {
      lines.push(`  -d '${typeof tc.request.body === 'string' ? tc.request.body : JSON.stringify(tc.request.body)}'`);
    }
    navigator.clipboard.writeText(lines.join(' \\\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors">
      {/* Card header — always visible */}
      <div
        className="flex items-start gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Category dot */}
        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${categoryMeta.dot}`} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-semibold text-slate-500">{tc.id}</span>

            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryMeta.badge}`}>
              {tc.category}
            </span>

            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[tc.priority] || PRIORITY_COLORS.Low}`}>
              {tc.priority}
            </span>
          </div>

          <p className="font-semibold text-white text-sm leading-snug">{tc.name}</p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{tc.description}</p>

          {/* Request summary */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${METHOD_COLORS[tc.request.method] || 'bg-slate-800 text-slate-400'}`}>
              {tc.request.method}
            </span>
            <span className="text-xs font-mono text-slate-300 truncate max-w-xs">
              {tc.request.url}
            </span>
            <span className="ml-auto text-xs shrink-0">
              <span className="text-slate-600">Expected: </span>
              <span className={`font-mono font-semibold ${statusColor(tc.expectedResponse.statusCode)}`}>
                {tc.expectedResponse.statusCode}
              </span>
            </span>
          </div>
        </div>

        {/* Expand arrow */}
        <span className={`text-slate-600 text-sm transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-800 px-5 py-4 space-y-4 bg-slate-950/30">
          {/* Request details */}
          <Section title="Request">
            {hasHeaders && (
              <DetailBlock label="Headers">
                {Object.entries(tc.request.headers).map(([k, v]) => (
                  <Row key={k} k={k} v={String(v)} />
                ))}
              </DetailBlock>
            )}
            {hasParams && (
              <DetailBlock label="Query Params">
                {Object.entries(tc.request.queryParams).map(([k, v]) => (
                  <Row key={k} k={k} v={String(v)} />
                ))}
              </DetailBlock>
            )}
            {hasBody && (
              <DetailBlock label="Body">
                <pre className="text-xs font-mono text-slate-300 bg-slate-900 rounded-lg p-3 overflow-x-auto scrollbar-thin">
                  {typeof tc.request.body === 'string'
                    ? tc.request.body
                    : JSON.stringify(tc.request.body, null, 2)}
                </pre>
              </DetailBlock>
            )}
          </Section>

          {/* Expected response */}
          <Section title="Expected Response">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-2xl font-mono font-bold ${statusColor(tc.expectedResponse.statusCode)}`}>
                {tc.expectedResponse.statusCode}
              </span>
              <span className="text-slate-400 text-sm">{tc.expectedResponse.description}</span>
            </div>
            {tc.expectedResponse.assertions?.length > 0 && (
              <ul className="space-y-1.5">
                {tc.expectedResponse.assertions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Notes */}
          {tc.notes && (
            <Section title="Notes">
              <p className="text-xs text-slate-400 leading-relaxed">{tc.notes}</p>
            </Section>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={copyAsCurl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              {copied ? '✓ Copied' : '📋 Copy as cURL'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}

function DetailBlock({ label, children }) {
  return (
    <div className="mb-3">
      <p className="text-xs text-slate-600 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex gap-3 text-xs font-mono py-0.5">
      <span className="text-slate-500 shrink-0 w-36 truncate">{k}</span>
      <span className="text-slate-300">{v}</span>
    </div>
  );
}
