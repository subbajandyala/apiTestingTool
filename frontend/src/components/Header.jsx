export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            AT
          </div>
          <div>
            <span className="font-semibold text-white text-lg tracking-tight">APITestify</span>
            <span className="hidden sm:inline text-slate-500 text-sm ml-2">AI-Powered Test Generator</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Powered by Claude AI
          </span>
        </div>
      </div>
    </header>
  );
}
