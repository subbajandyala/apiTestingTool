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

  const categories = ['All', ...Object.keys(summary.categories || {}).filter(
    (c) => (summary.categories[c] || 0) > 0
  )];

  const filtered = activeFilter === 'All'
    ? testCases
    : testCases.filter((tc) => tc.category === activeFilter);

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
          <div className="flex gap-2">
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
          <TestCaseCard key={tc.id} testCase={tc} categoryMeta={getCategoryMeta(tc.category)} />
        ))}
      </div>
    </div>
  );
}
