import { useState, useEffect, Fragment } from 'react';
import toast from 'react-hot-toast';
import { listUsers, registerUser, updateUser, deleteUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROLES             = ['gate', 'reception', 'admin'];
const EXTRA_PERMISSIONS = ['gate', 'reception'];
const PERM_LABELS       = { gate: 'Portail', reception: 'Réception' };

const ROLE_STYLE = {
  gate:      'badge bg-blue-50 text-blue-700 border border-blue-200',
  reception: 'badge bg-slate-100 text-slate-600 border border-slate-200',
  admin:     'badge bg-slate-800 text-white border border-slate-900',
};

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate,    setShowCreate]    = useState(false);
  const [form,          setForm]          = useState({ username: '', email: '', password: '', role: 'gate' });
  const [creating,      setCreating]      = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingId,     setEditingId]     = useState(null);
  const [editForm,      setEditForm]      = useState({});
  const [saving,        setSaving]        = useState(false);

  const load = () => {
    setLoading(true);
    listUsers()
      .then((r) => setUsers(r.data))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await registerUser(form);
      toast.success(`Compte "${form.username}" créé`);
      setForm({ username: '', email: '', password: '', role: 'gate' });
      setShowCreate(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Erreur');
    } finally { setCreating(false); }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({ username: u.username, email: u.email, password: '', role: u.role, permissions: u.permissions || [] });
  };

  const togglePerm = (perm) =>
    setEditForm((p) => ({
      ...p,
      permissions: p.permissions.includes(perm)
        ? p.permissions.filter((x) => x !== perm)
        : [...p.permissions, perm],
    }));

  const handleSave = async (id) => {
    setSaving(true);
    try {
      const payload = { username: editForm.username, email: editForm.email, role: editForm.role, permissions: editForm.permissions };
      if (editForm.password) payload.password = editForm.password;
      await updateUser(id, payload);
      toast.success('Compte mis à jour');
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      toast.success(`Compte ${u.is_active ? 'désactivé' : 'activé'}`);
      load();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      toast.success('Compte supprimé');
      setConfirmDelete(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  return (
    <div className="space-y-6 animate-fadein">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Utilisateurs</h1>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Annuler' : '+ Nouveau compte'}
        </button>
      </div>

      {/* ── Formulaire de création ───────────────────────────────────────── */}
      {showCreate && (
        <div className="card border-blue-200 bg-blue-50/30 animate-slideup">
          <h2 className="section-label mb-4">Créer un compte utilisateur</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label>Nom d'utilisateur *</label>
              <input className="input" required value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="field">
              <label>Adresse email *</label>
              <input className="input" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>
                Mot de passe *
                <span className="ml-1 text-slate-400 font-normal">(min. 8 caractères)</span>
              </label>
              <input className="input" type="password" required minLength={8} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="field">
              <label>Rôle *</label>
              <select className="input" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Liste ────────────────────────────────────────────────────────── */}
      <div className="card">
        {loading ? (
          <p className="text-center py-10 text-sm text-slate-400">Chargement...</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Identifiant</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Accès supplémentaires</th>
                  <th>Statut</th>
                  <th>Depuis</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <Fragment key={u.id}>
                    <tr className={!u.is_active ? 'opacity-40' : ''}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-slate-500">
                              {u.username[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900">{u.username}</span>
                            {u.id === me?.id && (
                              <span className="ml-1.5 text-[10px] text-blue-500 font-medium">vous</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-500 text-xs">{u.email}</td>
                      <td><span className={ROLE_STYLE[u.role]}>{u.role}</span></td>
                      <td>
                        {(u.permissions || []).filter((p) => p !== u.role).length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {(u.permissions || [])
                              .filter((p) => p !== u.role)
                              .map((p) => (
                                <span key={p} className="badge bg-slate-100 text-slate-600 border border-slate-200">
                                  {PERM_LABELS[p] || p}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          {u.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="text-xs text-slate-400">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            className="btn-secondary text-xs !py-1 !px-2.5"
                            onClick={() => editingId === u.id ? setEditingId(null) : startEdit(u)}
                          >
                            {editingId === u.id ? 'Fermer' : 'Modifier'}
                          </button>
                          {u.id !== me?.id && (
                            <>
                              <button
                                className="btn-secondary text-xs !py-1 !px-2.5"
                                onClick={() => toggleActive(u)}
                              >
                                {u.is_active ? 'Désactiver' : 'Activer'}
                              </button>
                              <button
                                className="btn-danger text-xs !py-1 !px-2.5"
                                onClick={() => setConfirmDelete(u)}
                              >
                                Supprimer
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Panneau d'édition inline */}
                    {editingId === u.id && (
                      <tr key={`edit-${u.id}`} className="animate-slideup">
                        <td colSpan={7} className="bg-slate-50 border-b border-slate-200 px-5 py-5">
                          <h3 className="section-label mb-4">Modifier — {u.username}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="field">
                              <label>Nom d'utilisateur</label>
                              <input className="input" value={editForm.username}
                                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
                            </div>
                            <div className="field">
                              <label>Email</label>
                              <input className="input" type="email" value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                            </div>
                            <div className="field">
                              <label>
                                Nouveau mot de passe
                                <span className="ml-1 text-slate-400 font-normal">(laisser vide = inchangé)</span>
                              </label>
                              <input className="input" type="password" placeholder="••••••••" minLength={8}
                                value={editForm.password}
                                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
                            </div>
                            <div className="field">
                              <label>Rôle</label>
                              <select className="input" value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                                {ROLES.map((r) => (
                                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-slate-600 mb-2.5">
                                Accès supplémentaires
                              </label>
                              <div className="flex gap-6">
                                {EXTRA_PERMISSIONS.map((perm) => {
                                  const isBase = editForm.role === perm || editForm.role === 'admin';
                                  return (
                                    <label
                                      key={perm}
                                      className={`flex items-center gap-2.5 text-sm cursor-pointer select-none
                                        ${isBase ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        disabled={isBase}
                                        checked={isBase || editForm.permissions.includes(perm)}
                                        onChange={() => togglePerm(perm)}
                                        className="w-4 h-4 rounded accent-blue-700"
                                      />
                                      <span className="text-slate-700">{PERM_LABELS[perm]}</span>
                                    </label>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-slate-400 mt-2">
                                Autorise cet utilisateur à agir sur ces espaces en plus de son rôle principal.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-5 pt-4 border-t border-slate-200">
                            <button className="btn-primary text-xs" disabled={saving} onClick={() => handleSave(u.id)}>
                              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                            <button className="btn-secondary text-xs" onClick={() => setEditingId(null)}>
                              Annuler
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal de confirmation ─────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-fadein">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl animate-slideup">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">Confirmer la suppression</h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Supprimer le compte de <strong className="text-slate-700">{confirmDelete.username}</strong> ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button className="btn-danger flex-1" onClick={() => handleDelete(confirmDelete.id)}>
                Supprimer
              </button>
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
