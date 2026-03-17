import { useState } from "react";
import toast from "react-hot-toast";
import { createVisitor } from "../services/api";

export default function VisitorModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    passport_number: "",
    visitor_number: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createVisitor(form);
      toast.success("Visiteur enregistré");
      onCreated(res.data);
    } catch (err) {
      toast.error(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.message ||
          "Erreur",
      );
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
              <svg
                className="w-4 h-4 text-blue-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Nouveau visiteur
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
                       hover:text-slate-700 hover:bg-slate-200 transition-colors duration-150"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field sm:col-span-2">
              <label>Nom complet *</label>
              <input
                className="input"
                required
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                placeholder="Prénom et nom"
              />
            </div>
            <div className="field">
              <label>Téléphone *</label>
              <input
                className="input"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+250 ..."
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="optionnel"
              />
            </div>
            <div className="field">
              <label>N° de passeport *</label>
              <input
                className="input"
                required
                value={form.passport_number}
                onChange={(e) =>
                  setForm({ ...form, passport_number: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>N° de visiteur *</label>
              <input
                className="input"
                required
                value={form.visitor_number}
                onChange={(e) =>
                  setForm({ ...form, visitor_number: e.target.value })
                }
              />
            </div>
            <div className="field sm:col-span-2">
              <label>Adresse</label>
              <input
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="optionnel"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Créer le visiteur"}
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
