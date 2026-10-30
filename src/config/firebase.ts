
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCgkaix1YkHin6tMB_ufeJRvujItlD_I7g',
  authDomain: 'hbplus-access-portal-1afd6.firebaseapp.com',
  projectId: 'hbplus-access-portal-1afd6',
  storageBucket: 'hbplus-access-portal-1afd6.appspot.com',
  messagingSenderId: '1051446789456',
  appId: '1:1051446789456:web:1234567890abcdef',
};

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;