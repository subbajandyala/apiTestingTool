export default function GeneratingState({ progress }) {
  const steps = [
    { label: 'Analyzing API structure', threshold: 10 },
    { label: 'Identifying test scenarios', threshold: 30 },
    { label: 'Generating happy path tests', threshold: 50 },
    { label: 'Building error & security cases', threshold: 70 },
    { label: 'Finalizing test suite', threshold: 90 },
  ];

  const currentStep = steps.filter((s) => progress >= s.threshold).at(-1) || steps[0];

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      {/* Animated spinner */}
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40" cy="40" r="34"
            fill="none" stroke="rgb(30 41 59)"
            strokeWidth="6"
          />
          <circle
            cx="40" cy="40" r="34"
            fill="none" stroke="rgb(59 130 246)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-blue-400">{progress}%</span>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-white">Generating Test Cases</h2>
        <p className="text-slate-400 text-sm">{currentStep.label}…</p>
      </div>

      {/* Step indicators */}
      <div className="space-y-2 w-full max-w-xs">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                progress >= step.threshold
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-600'
              }`}
            >
              {progress >= step.threshold ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            <span
              className={`text-sm transition-colors duration-300 ${
                progress >= step.threshold ? 'text-slate-200' : 'text-slate-600'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-4">This may take 15–30 seconds for complex APIs</p>
    </div>
  );
}
