import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getDashboard } from '../../services/api';

const KpiCard = ({ label, value, sub, accent }) => (
  <div className="card">
    <p className="section-label">{label}</p>
    <p className={`text-3xl font-bold mt-2 tabular-nums ${accent || 'text-slate-900'}`}>
      {value ?? '—'}
    </p>
    {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
  </div>
);

const NavCard = ({ to, label, desc }) => (
  <Link to={to} className="card-hover group block">
    <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-150">
      {label}
    </p>
    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
    <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      Ouvrir
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </span>
  </Link>
);

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Erreur chargement statistiques'))
      .finally(() => setLoading(false));
  }, []);

  const byStatus  = stats?.byStatus || [];
  const inside    = byStatus.find((s) => s.status === 'inside')?.count    || 0;
  const pending   = byStatus.find((s) => s.status === 'pending')?.count   || 0;
  const completed = byStatus.find((s) => s.status === 'completed')?.count || 0;

  return (
    <div className="space-y-8 animate-fadein">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-xs text-slate-400 mt-0.5 capitalize">
          {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      </div>

      {loading ? (
        <p className="text-center py-16 text-sm text-slate-400">Chargement...</p>
      ) : (
        <>
          {/* ── KPIs globaux ────────────────────────────────────────────── */}
          <section>
            <p className="section-label mb-4">Activité globale</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard label="Aujourd'hui"   value={stats?.today} sub="Visites enregistrées" accent="text-blue-700" />
              <KpiCard label="Cette semaine" value={stats?.week}  sub="Depuis lundi" />
              <KpiCard label="Ce mois"       value={stats?.month} sub="Depuis le 1er" />
            </div>
          </section>

          {/* ── KPIs temps réel ─────────────────────────────────────────── */}
          <section>
            <p className="section-label mb-4">Situation en temps réel</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard
                label="Présents"
                value={inside}
                sub="Visiteurs actuellement à l'intérieur"
                accent="text-blue-700"
              />
              <KpiCard
                label="En attente"
                value={pending}
                sub="Enregistrés, non encore entrés"
                accent="text-amber-600"
              />
              <KpiCard
                label="Terminées"
                value={completed}
                sub="Visites complétées aujourd'hui"
                accent="text-emerald-600"
              />
            </div>
          </section>

          {/* ── Accès rapide ────────────────────────────────────────────── */}
          <section>
            <p className="section-label mb-4">Accès rapide</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <NavCard to="/admin/reports" label="Rapports et exports"    desc="Historique filtrable, Print Gate, Print Réception" />
              <NavCard to="/admin/users"   label="Gestion des comptes"    desc="Créer, modifier, désactiver des utilisateurs" />
              <NavCard to="/gate"          label="Interface portail"      desc="Enregistrement des entrées et sorties" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
