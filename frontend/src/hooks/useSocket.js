import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (events = {}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('/', { transports: ['websocket'], autoConnect: true });
    Object.entries(events).forEach(([event, handler]) => {
      socketRef.current.on(event, handler);
    });
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef.current;
};
