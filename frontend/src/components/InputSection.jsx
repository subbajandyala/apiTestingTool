import { useState } from 'react';
import SwaggerInput from './SwaggerInput';
import CurlInput from './CurlInput';
import ManualInput from './ManualInput';

const TABS = [
  {
    id: 'swagger',
    label: 'Swagger / OpenAPI',
    icon: '📄',
    description: 'Import from a Swagger or OpenAPI spec URL',
  },
  {
    id: 'curl',
    label: 'cURL Command',
    icon: '⌨️',
    description: 'Paste a curl command to auto-extract details',
  },
  {
    id: 'manual',
    label: 'Manual Input',
    icon: '✏️',
    description: 'Fill in details like Postman',
  },
];

export default function InputSection({ onGenerate }) {
  const [activeTab, setActiveTab] = useState('manual');

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Generate API Test Cases Instantly
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
          Provide your API details via Swagger URL, a curl command, or manual input — Claude AI will generate a comprehensive test suite.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-4 rounded-xl border text-left transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-600/20 border-blue-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{tab.icon}</span>
              <div>
                <p className={`font-semibold text-sm ${activeTab === tab.id ? 'text-blue-300' : ''}`}>
                  {tab.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{tab.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Active form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        {activeTab === 'swagger' && <SwaggerInput onGenerate={onGenerate} />}
        {activeTab === 'curl' && <CurlInput onGenerate={onGenerate} />}
        {activeTab === 'manual' && <ManualInput onGenerate={onGenerate} />}
      </div>
    </div>
  );
}
