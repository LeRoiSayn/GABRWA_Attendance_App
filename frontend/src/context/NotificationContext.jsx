import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const NotificationContext = createContext(null);

/* ── Mapping événement → texte lisible ────────────────────────────────── */
const EVENT_MAP = {
  'visit:new': (d) => ({
    type:  'new',
    title: 'Nouvelle visite enregistrée',
    body:  `${d.visitor?.full_name} — ${d.purpose || ''}`,
  }),
  'gate:checkin': (d) => ({
    type:  'gate_in',
    title: 'Entrée portail',
    body:  `${d.visit?.visitor?.full_name} vient d'entrer`,
  }),
  'gate:checkout': (d) => ({
    type:  'gate_out',
    title: 'Sortie portail',
    body:  `${d.visit?.visitor?.full_name} a quitté le portail`,
  }),
  'reception:checkin': (d) => ({
    type:  'rec_in',
    title: 'Arrivée à la réception',
    body:  `${d.visit?.visitor?.full_name} est maintenant à la réception`,
  }),
  'reception:checkout': (d) => ({
    type:  'rec_out',
    title: 'Départ de la réception',
    body:  `${d.visit?.visitor?.full_name} a quitté la réception`,
  }),
  'visit:signed': () => ({
    type:  'gate_in',
    title: 'Signature reçue',
    body:  'Un visiteur vient de signer électroniquement',
  }),
};

const TYPE_COLOR = {
  new:      'bg-blue-500',
  gate_in:  'bg-emerald-500',
  gate_out: 'bg-amber-500',
  rec_in:   'bg-blue-400',
  rec_out:  'bg-slate-400',
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  const push = useCallback((n) => {
    setNotifications((prev) => [n, ...prev].slice(0, 60));
  }, []);

  useEffect(() => {
    /* Demande de permission navigateur */
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    socketRef.current = io('/', { transports: ['websocket'] });

    Object.entries(EVENT_MAP).forEach(([event, builder]) => {
      socketRef.current.on(event, (data) => {
        const { type, title, body } = builder(data);
        const n = {
          id:        `${Date.now()}-${Math.random()}`,
          type,
          title,
          body,
          timestamp: new Date(),
          read:      false,
        };
        push(n);

        /* Notification navigateur si onglet masqué */
        if (
          'Notification' in window &&
          Notification.permission === 'granted' &&
          document.visibilityState !== 'visible'
        ) {
          new Notification(`GABRWA — ${title}`, { body, tag: n.id });
        }
      });
    });

    return () => socketRef.current?.disconnect();
  }, [push]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const clearAll    = () => setNotifications([]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead, clearAll, TYPE_COLOR }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
