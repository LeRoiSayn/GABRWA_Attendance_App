import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { listVisitors } from '../../services/api';
import VisitorHistoryModal from '../../components/VisitorHistoryModal';

const fmtDate = (d) => d ? format(new Date(d), 'dd MMM yyyy', { locale: fr }) : '—';

export default function AdminVisitors() {
  const [visitors,     setVisitors]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [total,        setTotal]        = useState(0);
  const [historyId,    setHistoryId]    = useState(null);

  const load = useCallback(async (q = search, p = page) => {
    setLoading(true);
    try {
      const res = await listVisitors({ q, page: p });
      setVisitors(res.data.visitors);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(search, page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(search, 1);
  };

  return (
    <div className="space-y-6 animate-fadein">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Visiteurs</h1>
          <p className="text-xs text-slate-400 mt-0.5">{total} visiteur{total !== 1 ? 's' : ''} enregistré{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Recherche ────────────────────────────────────────────────────── */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            className="input flex-1"
            placeholder="Rechercher par nom, téléphone ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary">Rechercher</button>
          {search && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setSearch(''); setPage(1); load('', 1); }}
            >
              Effacer
            </button>
          )}
        </form>
      </div>

      {/* ── Tableau ──────────────────────────────────────────────────────── */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visitors.length === 0 ? (
          <p className="text-center py-12 text-sm text-slate-400">
            {search ? 'Aucun visiteur trouvé pour cette recherche' : 'Aucun visiteur enregistré'}
          </p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>N° visiteur</th>
                    <th>Visiteur</th>
                    <th>Contact</th>
                    <th>Passeport</th>
                    <th>Visites</th>
                    <th>Dernière visite</th>
                    <th>Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((v) => (
                    <tr
                      key={v.id}
                      className="cursor-pointer hover:bg-blue-50/50 transition-colors duration-100"
                      onClick={() => setHistoryId(v.id)}
                      title="Voir l'historique"
                    >
                      <td className="text-xs font-mono text-slate-600 whitespace-nowrap">
                        {v.visitor_number}
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">
                              {v.full_name[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{v.full_name}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-xs text-slate-700">{v.phone}</p>
                        {v.email && <p className="text-xs text-slate-400 mt-0.5">{v.email}</p>}
                      </td>
                      <td className="text-xs text-slate-500 whitespace-nowrap">
                        {v.passport_number || '—'}
                      </td>
                      <td>
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">
                          {v.visit_count}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500 whitespace-nowrap">
                        {fmtDate(v.last_visit)}
                      </td>
                      <td>
                        {v.has_signature ? (
                          <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Signé</span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">Page {page} sur {pages}</p>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary text-xs !py-1.5 !px-3"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Précédent
                  </button>
                  <button
                    className="btn-secondary text-xs !py-1.5 !px-3"
                    disabled={page === pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {historyId && (
        <VisitorHistoryModal visitorId={historyId} onClose={() => setHistoryId(null)} />
      )}
    </div>
  );
}
