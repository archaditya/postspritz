'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useAuthStore } from '../stores/useAuthStore';

interface SSEContextType {
  isConnected: boolean;
}

const SSEContext = createContext<SSEContextType>({ isConnected: false });

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { isConnected, setIsConnected, addNotification } = useNotificationStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    const token =
      localStorage.getItem('postspritz_access_token') ||
      localStorage.getItem('sharepostsync_access_token') ||
      localStorage.getItem('pushpost_access_token');
    if (!token) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const sseUrl = `${apiBaseUrl}/notifications/stream?token=${encodeURIComponent(token)}`;

    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          addNotification(data.payload);
        }
      } catch (err) {
        console.error('Failed to parse SSE payload', err);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      // Retry in 10s
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          eventSourceRef.current = null;
        }
      }, 10000);
    };

    return () => {
      es.close();
      setIsConnected(false);
    };
  }, [isAuthenticated, setIsConnected, addNotification]);

  return <SSEContext.Provider value={{ isConnected }}>{children}</SSEContext.Provider>;
}

export const useSSE = () => useContext(SSEContext);
