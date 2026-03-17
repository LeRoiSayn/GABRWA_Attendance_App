import { useState } from 'react';
import toast from 'react-hot-toast';
import { createVisit } from '../services/api';

export default function VisitModal({ visitor, onClose, onCreated }) {
  const [form,    setForm]    = useState({ purpose: '', host_name: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createVisit({ visitor_id: visitor.id, ...form });
      toast.success('Visite enregistrée');
      onCreated(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
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
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Nouvelle visite</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
                       hover:text-slate-700 hover:bg-slate-200 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Identité visiteur */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-sm font-bold text-white">
              {visitor.full_name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">{visitor.full_name}</p>
            <p className="text-xs text-blue-500 mt-0.5">{visitor.phone}</p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div className="field">
            <label>Motif de la visite *</label>
            <textarea
              className="input resize-none"
              rows={3}
              required
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="Réunion, démarche administrative, livraison..."
            />
          </div>
          <div className="field">
            <label>Personne ou département à rencontrer</label>
            <input
              className="input"
              value={form.host_name}
              onChange={(e) => setForm({ ...form, host_name: e.target.value })}
              placeholder="Nom ou service concerné"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Confirmer la visite'}
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
