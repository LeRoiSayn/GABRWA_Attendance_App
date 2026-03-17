import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { gateCheckin, gateCheckout, getGateHistory, exportGateExcel } from '../../services/api';
import VisitorSearchForm from '../../components/VisitorSearchForm';
import VisitorModal from '../../components/VisitorModal';
import VisitModal from '../../components/VisitModal';
import SignatureQRModal from '../../components/SignatureQRModal';
import VisitorHistoryModal from '../../components/VisitorHistoryModal';
import { useSocket } from '../../hooks/useSocket';

const STATUS_MAP = {
  pending:   { cls: 'badge-pending',   label: 'En attente' },
  inside:    { cls: 'badge-inside',    label: 'Présent'    },
  completed: { cls: 'badge-completed', label: 'Terminé'    },
  cancelled: { cls: 'badge-cancelled', label: 'Annulé'     },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { cls: 'badge', label: status };
  return <span className={s.cls}>{s.label}</span>;
};

const StatBox = ({ label, value, accent, icon }) => (
  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm min-w-[100px]">
    {icon && (
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent.bg}`}>
        <svg className={`w-4 h-4 ${accent.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
    )}
    <div>
      <p className={`text-xl font-bold tabular-nums ${accent.text}`}>{value}</p>
      <p className="text-[11px] text-slate-400 leading-tight">{label}</p>
    </div>
  </div>
);

export default function GateDashboard() {
  const [visits,           setVisits]           = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [showNewVisitor,   setShowNewVisitor]   = useState(false);
  const [selectedVisitor,  setSelectedVisitor]  = useState(null);
  const [showVisitModal,   setShowVisitModal]   = useState(false);
  const [detailVisit,      setDetailVisit]      = useState(null);
  const [actionLoading,    setActionLoading]    = useState({});
  const [exporting,        setExporting]        = useState(false);
  const [signatureVisit,   setSignatureVisit]   = useState(null);
  const [historyVisitorId, setHistoryVisitorId] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    try {
      const res = await getGateHistory({ date: today });
      setVisits(res.data);
    } catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  }, [today]);

  useEffect(() => { load(); }, [load]);

  useSocket({
    'gate:checkin':  () => load(),
    'gate:checkout': () => load(),
    'visit:new':     () => load(),
  });

  const act = async (key, apiFn, successMsg) => {
    setActionLoading((p) => ({ ...p, [key]: true }));
    try { await apiFn(); toast.success(successMsg); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setActionLoading((p) => ({ ...p, [key]: false })); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportGateExcel({ date: today });
      const url = URL.createObjectURL(new Blob([res.data]));
      Object.assign(document.createElement('a'), { href: url, download: `portail_${today}.xlsx` }).click();
      URL.revokeObjectURL(url);
      toast.success('Export téléchargé');
    } catch { toast.error('Erreur export'); }
    finally { setExporting(false); }
  };

  const inside  = visits.filter((v) => v.status === 'inside').length;
  const pending = visits.filter((v) => v.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fadein">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Portail</h1>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2">
            <StatBox label="Présents"   value={inside}        accent={{ text: 'text-blue-700',  bg: 'bg-blue-50',   icon: 'text-blue-600'  }}
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
            />
            <StatBox label="En attente" value={pending}       accent={{ text: 'text-amber-600', bg: 'bg-amber-50',  icon: 'text-amber-500' }}
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
            />
            <StatBox label="Total"      value={visits.length} accent={{ text: 'text-slate-700', bg: 'bg-slate-100', icon: 'text-slate-500' }}
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
            />
          </div>
          <button className="btn-secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exportation...' : 'Print Gate'}
          </button>
        </div>
      </div>

      {/* ── Enregistrement ───────────────────────────────────────────────── */}
      <div className="card">
        <h2 className="section-label mb-4">Rechercher ou enregistrer un visiteur</h2>
        <VisitorSearchForm
          onSelect={(v) => { setSelectedVisitor(v); setShowVisitModal(true); }}
          onCreateNew={() => setShowNewVisitor(true)}
        />
      </div>

      {/* ── Liste des visites ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-label">Visites du jour</h2>
          <button onClick={load} className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150">
            Actualiser
          </button>
        </div>

        {loading ? (
          <p className="text-center py-12 text-sm text-slate-400">Chargement...</p>
        ) : visits.length === 0 ? (
          <p className="text-center py-12 text-sm text-slate-400">Aucune visite enregistrée aujourd'hui</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Visiteur</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th>Entrée</th>
                  <th>Sortie</th>
                  <th>Signature</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-slate-500">
                            {v.visitor?.full_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <button
                            className="font-semibold text-slate-900 hover:text-blue-700 hover:underline text-left transition-colors duration-150"
                            onClick={() => setHistoryVisitorId(v.visitor?.id)}
                          >
                            {v.visitor?.full_name}
                          </button>
                          <p className="text-xs text-slate-400">{v.visitor?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => setDetailVisit(detailVisit?.id === v.id ? null : v)}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-xs
                                   max-w-[140px] truncate block text-left transition-colors duration-150"
                        title={v.purpose}
                      >
                        {v.purpose.length > 35 ? v.purpose.slice(0, 35) + '…' : v.purpose}
                      </button>
                    </td>
                    <td><StatusBadge status={v.status} /></td>
                    <td className="text-xs font-medium text-slate-600">
                      {v.gateCheck?.gate_checkin_time
                        ? format(new Date(v.gateCheck.gate_checkin_time), 'HH:mm')
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="text-xs font-medium text-slate-600">
                      {v.gateCheck?.gate_checkout_time
                        ? format(new Date(v.gateCheck.gate_checkout_time), 'HH:mm')
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td>
                      {v.has_signature ? (
                        <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Signé
                        </span>
                      ) : (
                        <button
                          className="btn-secondary text-xs !py-1 !px-2.5"
                          onClick={() => setSignatureVisit(v)}
                          title="Demander la signature"
                        >
                          QR Signature
                        </button>
                      )}
                    </td>
                    <td>
                      {v.status === 'pending' && (
                        <button
                          className="btn-success text-xs !py-1 !px-3"
                          disabled={actionLoading[`in_${v.id}`]}
                          onClick={() => act(`in_${v.id}`, () => gateCheckin({ visit_id: v.id }), 'Entrée enregistrée')}
                        >
                          {actionLoading[`in_${v.id}`] ? '...' : 'Entrée'}
                        </button>
                      )}
                      {v.status === 'inside' && (
                        <button
                          className="btn-warning text-xs !py-1 !px-3"
                          disabled={actionLoading[`out_${v.id}`]}
                          onClick={() => act(`out_${v.id}`, () => gateCheckout({ visit_id: v.id }), 'Sortie enregistrée')}
                        >
                          {actionLoading[`out_${v.id}`] ? '...' : 'Sortie'}
                        </button>
                      )}
                      {v.status === 'completed' && (
                        <span className="text-xs text-slate-400">Terminé</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Panneau de détail ─────────────────────────────────────────────── */}
      {detailVisit && (
        <div className="card border-blue-200 bg-blue-50/40 animate-slideup">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
              Détail — Visite #{detailVisit.id}
            </h3>
            <button
              onClick={() => setDetailVisit(null)}
              className="text-xs text-blue-500 hover:text-blue-800 transition-colors duration-150 underline"
            >
              Fermer
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {[
              ['Visiteur',         detailVisit.visitor?.full_name],
              ['Téléphone',        detailVisit.visitor?.phone],
              ['Personne visitée', detailVisit.host_name || '—'],
              ['Statut',           <StatusBadge key="s" status={detailVisit.status} />],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">{k}</dt>
                <dd className="font-medium text-slate-800">{v}</dd>
              </div>
            ))}
            <div className="col-span-2">
              <dt className="text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">Motif</dt>
              <dd className="font-medium text-slate-800">{detailVisit.purpose}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Modals */}
      {showNewVisitor && (
        <VisitorModal
          onClose={() => setShowNewVisitor(false)}
          onCreated={(v) => { setShowNewVisitor(false); setSelectedVisitor(v); setShowVisitModal(true); }}
        />
      )}
      {showVisitModal && selectedVisitor && (
        <VisitModal
          visitor={selectedVisitor}
          onClose={() => { setShowVisitModal(false); setSelectedVisitor(null); }}
          onCreated={() => { setShowVisitModal(false); setSelectedVisitor(null); toast.success('Visite enregistrée'); load(); }}
        />
      )}
      {signatureVisit && (
        <SignatureQRModal
          visit={signatureVisit}
          onClose={() => { setSignatureVisit(null); load(); }}
          onSigned={() => { toast.success('Signature reçue'); load(); }}
        />
      )}
      {historyVisitorId && (
        <VisitorHistoryModal visitorId={historyVisitorId} onClose={() => setHistoryVisitorId(null)} />
      )}
    </div>
  );
}
