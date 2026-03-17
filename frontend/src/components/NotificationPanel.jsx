import { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotifications } from '../context/NotificationContext';

const TYPE_ICON = {
  new: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  ),
  gate_in: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  ),
  gate_out: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  ),
  rec_in: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  ),
  rec_out: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7" />
  ),
};

const TYPE_BG = {
  new:      'bg-blue-100 text-blue-700',
  gate_in:  'bg-emerald-100 text-emerald-700',
  gate_out: 'bg-amber-100 text-amber-700',
  rec_in:   'bg-blue-100 text-blue-600',
  rec_out:  'bg-slate-100 text-slate-500',
};

export default function NotificationPanel({ onClose }) {
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();

  /* Marquer comme lu immédiatement à l'ouverture */
  useEffect(() => {
    markAllRead();
  }, []);

  return (
    <>
      {/* Overlay transparent pour fermer au clic extérieur */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-fadein">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-xs text-blue-600 mt-0.5">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors duration-150 px-2 py-1 rounded-md hover:bg-slate-100"
            >
              Tout effacer
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
                       hover:text-slate-700 hover:bg-slate-100 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Aucune notification</p>
            <p className="text-xs text-slate-400 mt-1">Les événements en temps réel apparaîtront ici</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3.5 flex gap-3 transition-colors duration-100
                  ${!n.read ? 'bg-blue-50/40' : 'bg-white hover:bg-slate-50'}`}
              >
                {/* Icône type */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${TYPE_BG[n.type] || 'bg-slate-100 text-slate-500'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {TYPE_ICON[n.type] || TYPE_ICON.new}
                  </svg>
                </div>

                {/* Contenu */}
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold leading-snug ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: fr })}
                  </p>
                </div>

                {/* Indicateur non lu */}
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
