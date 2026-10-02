const COLORS = {
  GET:    'bg-emerald-900/50 text-emerald-400',
  POST:   'bg-blue-900/50 text-blue-400',
  PUT:    'bg-amber-900/50 text-amber-400',
  PATCH:  'bg-purple-900/50 text-purple-400',
  DELETE: 'bg-red-900/50 text-red-400',
};

export default function MethodBadge({ method }) {
  return (
    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 ${COLORS[method] || 'bg-slate-800 text-slate-400'}`}>
      {method}
    </span>
  );
}
