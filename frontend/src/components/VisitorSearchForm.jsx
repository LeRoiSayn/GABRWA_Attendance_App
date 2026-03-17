import { useState } from 'react';
import toast from 'react-hot-toast';
import { searchVisitors } from '../services/api';

export default function VisitorSearchForm({ onSelect, onCreateNew }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const params = query.includes('@')
        ? { email: query }
        : /^\+?[\d\s\-()]+$/.test(query)
          ? { phone: query }
          : { name: query };
      const res = await searchVisitors(params);
      setResults(res.data);
      if (!res.data.length) toast('Aucun visiteur trouvé');
    } catch {
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={search} className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Nom, téléphone ou email..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setResults([]); }}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? '...' : 'Chercher'}
        </button>
        {onCreateNew && (
          <button type="button" className="btn-secondary" onClick={onCreateNew}>
            Nouveau visiteur
          </button>
        )}
      </form>

      {results.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden animate-slideup">
          {results.map((v, idx) => (
            <button
              key={v.id}
              onClick={() => { onSelect(v); setResults([]); setQuery(''); }}
              className={`
                w-full text-left px-4 py-3 flex items-center gap-3
                hover:bg-blue-50 transition-colors duration-150
                ${idx !== results.length - 1 ? 'border-b border-slate-100' : ''}
              `}
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200
                              flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-blue-700">
                  {v.full_name[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{v.full_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {v.phone}{v.email ? ` · ${v.email}` : ''}
                </p>
              </div>
              <svg className="w-4 h-4 text-slate-300 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
