import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';
import { apiClient } from './api-client';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'postspritz-media'}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'postspritz-media',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'postspritz-media'}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (!app) {
    if (getApps().length > 0) {
      app = getApp();
    } else if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  if (!auth) {
    const fApp = getFirebaseApp();
    if (fApp) {
      auth = getAuth(fApp);
    }
  }
  return auth;
}

/**
 * Triggers Google Sign-In popup via Firebase and returns the ID token.
 */
export async function signInWithGooglePopup(): Promise<string> {
  const fAuth = getFirebaseAuth();
  if (!fAuth) {
    throw new Error('Firebase Auth not available. Please verify Firebase client config in .env.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const userCredential = await signInWithPopup(fAuth, provider);
  return userCredential.user.getIdToken();
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!messaging) {
    const fApp = getFirebaseApp();
    if (fApp) {
      try {
        messaging = getMessaging(fApp);
      } catch (err) {
        console.warn('Firebase Messaging not supported in this browser environment:', err);
      }
    }
  }
  return messaging;
}

/**
 * Requests browser notification permission, registers service worker,
 * retrieves FCM device token, and synchronizes token with backend database.
 */
export async function requestNotificationPermissionAndRegisterToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn('Push notifications are not supported by this browser.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('Notification permission denied by user.');
      return null;
    }

    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const msg = getFirebaseMessaging();
    if (!msg) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const currentToken = await getToken(msg, {
      serviceWorkerRegistration: swReg,
      vapidKey: vapidKey || undefined,
    });

    if (currentToken) {
      localStorage.setItem('postspritz_fcm_token', currentToken);
      // Synchronize with backend API
      try {
        await apiClient.post('/auth/fcm-token', {
          fcmToken: currentToken,
          deviceType: 'web',
        });
      } catch (apiErr) {
        console.warn('Could not sync FCM token with backend yet:', apiErr);
      }
      return currentToken;
    }
    return null;
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
}

/**
 * Removes local FCM token and unregisters it from the backend on logout.
 */
export async function unregisterFcmTokenOnLogout(): Promise<void> {
  if (typeof window === 'undefined') return;
  const currentToken = localStorage.getItem('postspritz_fcm_token');
  if (currentToken) {
    try {
      await apiClient.delete('/auth/fcm-token', {
        data: { fcmToken: currentToken },
      });
    } catch {
      // Ignored if session already terminated
    } finally {
      localStorage.removeItem('postspritz_fcm_token');
    }
  }
}

/**
 * Listens for push messages received while the tab is active/foreground.
 */
export function listenToForegroundMessages(onPayload: (payload: any) => void): () => void {
  const msg = getFirebaseMessaging();
  if (!msg) return () => {};
  return onMessage(msg, (payload) => {
    onPayload(payload);
  });
}
