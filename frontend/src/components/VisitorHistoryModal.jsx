import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getVisitor } from '../services/api';

const STATUS_LABEL = {
  pending:   { cls: 'badge-pending',   label: 'En attente' },
  inside:    { cls: 'badge-inside',    label: 'Présent'    },
  completed: { cls: 'badge-completed', label: 'Terminé'    },
  cancelled: { cls: 'badge-cancelled', label: 'Annulé'     },
};

const fmt = (dt) => dt ? format(new Date(dt), 'HH:mm', { locale: fr }) : '—';
const fmtDate = (d) => d ? format(new Date(d), 'dd MMM yyyy', { locale: fr }) : '—';

export default function VisitorHistoryModal({ visitorId, onClose }) {
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sigPreview, setSigPreview] = useState(null);

  useEffect(() => {
    getVisitor(visitorId)
      .then((r) => setVisitor(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visitorId]);

  const visits = visitor?.visits
    ? [...visitor.visits].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fadein">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200
                      flex flex-col animate-slideup overflow-hidden">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <h3 className="text-sm font-semibold text-slate-900">Fiche visiteur</h3>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
                       hover:text-slate-700 hover:bg-slate-200 transition-colors duration-150">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !visitor ? (
            <p className="text-center py-12 text-sm text-slate-400">Visiteur introuvable</p>
          ) : (
            <div className="p-6 space-y-6">

              {/* ── Identité ─────────────────────────────────────────────── */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-700 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-2xl font-bold text-white">
                    {visitor.full_name[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-slate-900">{visitor.full_name}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {visitor.phone}
                    </span>
                    {visitor.email && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {visitor.email}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                      </svg>
                      Passeport : {visitor.passport_number}
                    </span>
                    {visitor.nationality && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                        </svg>
                        {visitor.nationality}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      N° visiteur : {visitor.visitor_number}
                    </span>
                    {visitor.address && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Quartier : {visitor.address}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-slate-900">{visits.length}</p>
                  <p className="text-xs text-slate-400">visite{visits.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* ── Dernière signature ────────────────────────────────────── */}
              {(() => {
                const signed = visits.find((v) => v.has_signature && v.signature_path);
                if (!signed) return null;
                return (
                  <div>
                    <p className="section-label mb-3">Dernière signature</p>
                    <div className="border border-slate-200 rounded-xl overflow-hidden inline-block bg-white shadow-sm">
                      {sigPreview === signed.id ? (
                        <div className="relative">
                          <img
                            src={`/${signed.signature_path}`}
                            alt="Signature"
                            className="max-w-[320px] max-h-[160px] object-contain p-3"
                          />
                          <button
                            onClick={() => setSigPreview(null)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/60 text-white
                                       flex items-center justify-center hover:bg-slate-900 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSigPreview(signed.id)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-semibold text-slate-800">Signature disponible</p>
                            <p className="text-[10px] text-slate-400">Cliquer pour afficher</p>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── Historique des visites ────────────────────────────────── */}
              <div>
                <p className="section-label mb-3">Historique des visites</p>
                {visits.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">Aucune visite enregistrée</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Motif</th>
                          <th>Hôte</th>
                          <th>Statut</th>
                          <th>Entrée</th>
                          <th>Sortie</th>
                          <th>Réception</th>
                          <th>Sig.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visits.map((v) => {
                          const s = STATUS_LABEL[v.status] || { cls: 'badge', label: v.status };
                          return (
                            <tr key={v.id}>
                              <td className="whitespace-nowrap text-slate-600 text-xs">
                                {fmtDate(v.visit_date)}
                              </td>
                              <td className="max-w-[160px]">
                                <p className="truncate text-xs text-slate-700" title={v.purpose}>{v.purpose}</p>
                              </td>
                              <td className="text-xs text-slate-500">{v.host_name || '—'}</td>
                              <td><span className={s.cls}>{s.label}</span></td>
                              <td className="text-xs font-medium text-slate-600 whitespace-nowrap">
                                {fmt(v.gateCheck?.gate_checkin_time)}
                              </td>
                              <td className="text-xs font-medium text-slate-600 whitespace-nowrap">
                                {fmt(v.gateCheck?.gate_checkout_time)}
                              </td>
                              <td className="text-xs text-slate-500 whitespace-nowrap">
                                {v.receptionCheck?.reception_checkin
                                  ? `${fmt(v.receptionCheck.reception_checkin)}${v.receptionCheck.reception_checkout ? ` → ${fmt(v.receptionCheck.reception_checkout)}` : ''}`
                                  : '—'}
                              </td>
                              <td>
                                {v.has_signature
                                  ? <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Signé</span>
                                  : <span className="text-slate-300 text-xs">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
