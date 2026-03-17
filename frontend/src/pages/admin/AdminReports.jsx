import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { getReport, exportExcel, exportCSV } from '../../services/api';

const today = () => new Date().toISOString().split('T')[0];

const STATUS_LABELS = {
  pending:   { cls: 'badge-pending',   label: 'En attente' },
  inside:    { cls: 'badge-inside',    label: 'Présent'    },
  completed: { cls: 'badge-completed', label: 'Terminé'    },
  cancelled: { cls: 'badge-cancelled', label: 'Annulé'     },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_LABELS[status] || { cls: 'badge', label: status };
  return <span className={s.cls}>{s.label}</span>;
};

const PRESETS = [
  { label: "Aujourd'hui",   fn: () => ({ start: today(), end: today() }) },
  { label: 'Hier',          fn: () => { const d = subDays(new Date(), 1).toISOString().split('T')[0]; return { start: d, end: d }; } },
  { label: 'Cette semaine', fn: () => ({ start: startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0], end: today() }) },
  { label: 'Ce mois',       fn: () => ({ start: startOfMonth(new Date()).toISOString().split('T')[0], end: today() }) },
];

export default function AdminReports() {
  const [startDate, setStartDate] = useState(today());
  const [endDate,   setEndDate]   = useState(today());
  const [visits,    setVisits]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [exporting, setExporting] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getReport({ start_date: startDate, end_date: endDate });
      setVisits(res.data);
    } catch { toast.error('Erreur chargement rapport'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const dl = (blob, name) => {
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: name }).click();
    URL.revokeObjectURL(url);
  };

  const handleExportGate = async () => {
    setExporting('xlsx');
    try {
      const res = await exportExcel({ start_date: startDate, end_date: endDate });
      dl(new Blob([res.data]), `portail_${startDate}_${endDate}.xlsx`);
      toast.success('Export portail téléchargé');
    } catch { toast.error('Erreur export'); }
    finally { setExporting(''); }
  };

  const handleExportReception = async () => {
    setExporting('csv');
    try {
      const res = await exportCSV({ start_date: startDate, end_date: endDate });
      dl(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }), `reception_${startDate}_${endDate}.csv`);
      toast.success('Export réception téléchargé');
    } catch { toast.error('Erreur export'); }
    finally { setExporting(''); }
  };

  return (
    <div className="space-y-6 animate-fadein">

      <h1 className="text-xl font-bold text-slate-900">Rapports</h1>

      {/* ── Filtres ──────────────────────────────────────────────────────── */}
      <div className="card">
        <p className="section-label mb-4">Période</p>

        {/* Raccourcis */}
        <div className="flex flex-wrap gap-2 mb-5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className="btn-secondary text-xs !py-1.5 !px-3"
              onClick={() => { const r = p.fn(); setStartDate(r.start); setEndDate(r.end); }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sélecteurs + actions */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="field">
            <label>Date début</label>
            <input type="date" className="input w-auto" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Date fin</label>
            <input type="date" className="input w-auto" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={load} disabled={loading}>
            {loading ? '...' : 'Filtrer'}
          </button>
          <div className="flex gap-2 ml-auto">
            <button
              className="btn-secondary"
              onClick={handleExportGate}
              disabled={!!exporting}
              title="Visites portail uniquement (sans réception)"
            >
              {exporting === 'xlsx' ? 'Exportation...' : 'Print Gate'}
            </button>
            <button
              className="btn-secondary"
              onClick={handleExportReception}
              disabled={!!exporting}
              title="Visites portail + réception"
            >
              {exporting === 'csv' ? 'Exportation...' : 'Print Réception'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Résultats ─────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-label">Résultats</h2>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2.5 py-1 font-medium">
            {visits.length} visite{visits.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <p className="text-center py-14 text-sm text-slate-400">Chargement...</p>
        ) : visits.length === 0 ? (
          <p className="text-center py-14 text-sm text-slate-400">Aucune visite sur cette période</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Visiteur</th>
                  <th>Motif</th>
                  <th>Hôte</th>
                  <th>Statut</th>
                  <th>Entrée portail</th>
                  <th>Sortie portail</th>
                  <th>Arrivée réception</th>
                  <th>Départ réception</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id}>
                    <td className="whitespace-nowrap text-slate-500 text-xs">{v.visit_date}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-semibold text-slate-500">
                            {v.visitor?.full_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-xs">{v.visitor?.full_name}</p>
                          <p className="text-[11px] text-slate-400">{v.visitor?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[160px]">
                      <p className="truncate text-slate-600 text-xs" title={v.purpose}>{v.purpose}</p>
                    </td>
                    <td className="text-slate-500 text-xs">{v.host_name || '—'}</td>
                    <td><StatusBadge status={v.status} /></td>
                    <td className="whitespace-nowrap text-slate-500 text-xs">
                      {v.gateCheck?.gate_checkin_time  ? format(new Date(v.gateCheck.gate_checkin_time),  'dd/MM HH:mm') : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="whitespace-nowrap text-slate-500 text-xs">
                      {v.gateCheck?.gate_checkout_time ? format(new Date(v.gateCheck.gate_checkout_time), 'dd/MM HH:mm') : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="whitespace-nowrap text-slate-500 text-xs">
                      {v.receptionCheck?.reception_checkin  ? format(new Date(v.receptionCheck.reception_checkin),  'dd/MM HH:mm') : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="whitespace-nowrap text-slate-500 text-xs">
                      {v.receptionCheck?.reception_checkout ? format(new Date(v.receptionCheck.reception_checkout), 'dd/MM HH:mm') : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
