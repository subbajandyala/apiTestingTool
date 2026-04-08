import { useState } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import TestResults from './components/TestResults';
import GeneratingState from './components/GeneratingState';

function App() {
  const [testResults, setTestResults] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleGenerate = async (apiDetails) => {
    setIsGenerating(true);
    setTestResults(null);
    setError(null);
    setProgress(0);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiDetails }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.progress !== undefined) {
              // Rough progress based on chars generated (typical response ~8k chars)
              setProgress(Math.min(90, Math.round((data.progress / 8000) * 90)));
            } else if (data.done && data.result) {
              setProgress(100);
              setTestResults(data.result);
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes('JSON')) {
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!isGenerating && !testResults && (
          <InputSection onGenerate={handleGenerate} />
        )}

        {isGenerating && (
          <GeneratingState progress={progress} />
        )}

        {!isGenerating && error && (
          <div className="space-y-6">
            <div className="p-5 bg-red-950/40 border border-red-800 rounded-xl text-red-300 flex items-start gap-3">
              <span className="text-red-400 text-xl mt-0.5">✗</span>
              <div>
                <p className="font-semibold text-red-200 mb-1">Generation Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={() => { setError(null); setTestResults(null); }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              ← Try Again
            </button>
          </div>
        )}

        {!isGenerating && testResults && (
          <div className="space-y-6">
            <button
              onClick={() => { setTestResults(null); setError(null); }}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← New Test
            </button>
            <TestResults results={testResults} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
