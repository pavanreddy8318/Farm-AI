import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { setAuthToken } from './auth';

const firebaseConfig = {
  apiKey: "AIzaSyDVcU-bvIvKdf9LgXqzEKhcUWdna8VrBa4",
  authDomain:  "farmai-1d30e.firebaseapp.com",
  projectId: "farmai-1d30e",
  storageBucket: "farmai-1d30e.firebasestorage.app",
  messagingSenderId: "1052121251542",
  appId:"1:1052121251542:web:3ec7f278b85cb594ff9377",
  measurementId: "G-1ZREVT605C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const firebaseSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.warn('Firebase sign-in skipped or unavailable:', err);
    return null;
  }
};

export const firebaseSignInAndPersist = async () => {
  const user = await firebaseSignIn();
  if (!user) {
    return null;
  }

  try {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebaseUid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to create Google session.');
    }

    const data = await response.json();
    if (data.token) {
      setAuthToken(data.token);
    }
  } catch (err) {
    console.warn('Failed to persist Google session to backend:', err);
  }

  return user;
};

export const firebaseSignOut = async () => {
  await signOut(auth);
};

export const onFirebaseAuthState = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};
