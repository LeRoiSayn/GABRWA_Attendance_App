import { useState } from 'react';
import toast from 'react-hot-toast';
import { receptionCheckout } from '../services/api';

export default function ReceptionCheckoutModal({ visit, onClose, onDone }) {
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await receptionCheckout({ visit_id: visit.id, observations: observations.trim() || undefined });
      toast.success('Départ réception enregistré');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fadein">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 animate-slideup overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Enregistrer le départ</h3>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
                       hover:text-slate-700 hover:bg-slate-200 transition-colors duration-150">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Visiteur */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-5">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">
                {visit.visitor?.full_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{visit.visitor?.full_name}</p>
              <p className="text-xs text-slate-400 truncate max-w-[280px]">{visit.purpose}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="field">
            <label>Observations <span className="text-slate-400 font-normal">(optionnel)</span></label>
            <textarea
              className="input min-h-[90px] resize-y"
              placeholder="Raison de la visite incomplète, remarques, incidents..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1 border-t border-slate-100">
            <button type="submit" className="btn-warning flex-1" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Confirmer le départ'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
