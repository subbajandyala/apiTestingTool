import { useState } from 'react';
import TestCaseCard from './TestCaseCard';

const CATEGORY_META = {
  'Happy Path':     { color: 'bg-emerald-900/40 border-emerald-700/60 text-emerald-300', dot: 'bg-emerald-400', badge: 'bg-emerald-900 text-emerald-300' },
  'Authentication': { color: 'bg-blue-900/40 border-blue-700/60 text-blue-300',          dot: 'bg-blue-400',    badge: 'bg-blue-900 text-blue-300' },
  'Validation':     { color: 'bg-amber-900/40 border-amber-700/60 text-amber-300',        dot: 'bg-amber-400',   badge: 'bg-amber-900 text-amber-300' },
  'Error Handling': { color: 'bg-red-900/40 border-red-700/60 text-red-300',             dot: 'bg-red-400',     badge: 'bg-red-900 text-red-300' },
  'Security':       { color: 'bg-purple-900/40 border-purple-700/60 text-purple-300',    dot: 'bg-purple-400',  badge: 'bg-purple-900 text-purple-300' },
  'Edge Cases':     { color: 'bg-slate-800/60 border-slate-700 text-slate-300',          dot: 'bg-slate-400',   badge: 'bg-slate-800 text-slate-300' },
};

function getCategoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META['Edge Cases'];
}

export default function TestResults({ results }) {
  const { summary, testCases } = results;
  const [activeFilter, setActiveFilter] = useState('All');
  const [copied, setCopied] = useState(false);

  // Run tests state
  const [showRunPanel, setShowRunPanel] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [runError, setRunError] = useState(null);

  const categories = ['All', ...Object.keys(summary.categories || {}).filter(
    (c) => (summary.categories[c] || 0) > 0
  )];

  const filtered = activeFilter === 'All'
    ? testCases
    : testCases.filter((tc) => tc.category === activeFilter);

  const runResultMap = runResults
    ? Object.fromEntries(runResults.map((r) => [r.id, r]))
    : {};

  const passedCount = runResults ? runResults.filter((r) => r.passed).length : 0;
  const failedCount = runResults ? runResults.filter((r) => !r.passed && !r.error).length : 0;
  const errorCount  = runResults ? runResults.filter((r) => r.error).length : 0;

  const handleRunTests = async () => {
    if (!baseUrl.trim()) return;
    setIsRunning(true);
    setRunResults(null);
    setRunError(null);

    try {
      const res = await fetch('/api/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases, baseUrl: baseUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run tests');
      setRunResults(data.results);
      setShowRunPanel(false);
    } catch (e) {
      setRunError(e.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-cases.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    const text = testCases.map((tc) =>
      `[${tc.id}] ${tc.name}\nCategory: ${tc.category} | Priority: ${tc.priority}\n${tc.description}\n` +
      `Request: ${tc.request.method} ${tc.request.url}\nExpected: ${tc.expectedResponse.statusCode} - ${tc.expectedResponse.description}\n` +
      `Assertions:\n${(tc.expectedResponse.assertions || []).map((a) => `  • ${a}`).join('\n')}\n`
    ).join('\n─────────────────────────────\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {summary.totalTests} Test Cases Generated
            </h2>
            <p className="text-slate-400 text-sm mt-1">{summary.endpoint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setShowRunPanel(!showRunPanel); setRunError(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showRunPanel
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-700/50'
              }`}
            >
              ▶ Run Tests
            </button>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              {copied ? '✓ Copied' : '📋 Copy All'}
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              ↓ Export JSON
            </button>
          </div>
        </div>

        {/* Run Tests panel */}
        {showRunPanel && (
          <div className="mt-5 p-4 bg-slate-950/60 border border-slate-700 rounded-xl space-y-3">
            <p className="text-sm font-medium text-slate-300">Execute against a live API</p>
            <p className="text-xs text-slate-500">
              Runs all {testCases.length} test cases and compares actual HTTP status codes to expected values.
              Test cases with relative URLs will be prefixed with this base URL.
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunTests()}
                placeholder="https://api.example.com"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
              <button
                onClick={handleRunTests}
                disabled={!baseUrl.trim() || isRunning}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                {isRunning ? 'Running…' : `Run ${testCases.length} Tests`}
              </button>
            </div>
            {runError && (
              <p className="text-red-400 text-xs bg-red-950/30 border border-red-800 rounded px-3 py-2">
                {runError}
              </p>
            )}
          </div>
        )}

        {/* Run results summary bar */}
        {runResults && (
          <div className="mt-4 flex flex-wrap items-center gap-3 p-3 bg-slate-950/40 border border-slate-700 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Run complete:</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {passedCount} passed
            </span>
            {failedCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-red-300">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {failedCount} failed
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {errorCount} errors
              </span>
            )}
            <button
              onClick={() => setRunResults(null)}
              className="ml-auto text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Category breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
          {Object.entries(summary.categories || {}).map(([cat, count]) => {
            const meta = getCategoryMeta(cat);
            return (
              <div key={cat} className={`rounded-lg p-3 border ${meta.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                  <span className="text-xs font-medium truncate">{cat}</span>
                </div>
                <p className="text-2xl font-bold ml-4">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const meta = cat !== 'All' ? getCategoryMeta(cat) : null;
          const count = cat === 'All' ? testCases.length : (summary.categories?.[cat] || 0);
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {cat !== 'All' && meta && (
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
              )}
              {cat}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === cat ? 'bg-blue-500/50' : 'bg-slate-800'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Test case cards */}
      <div className="space-y-3">
        {filtered.map((tc) => (
          <TestCaseCard
            key={tc.id}
            testCase={tc}
            categoryMeta={getCategoryMeta(tc.category)}
            runResult={runResultMap[tc.id]}
          />
        ))}
      </div>
    </div>
  );
}
