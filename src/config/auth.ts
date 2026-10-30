
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    type User,
} from 'firebase/auth';

import { auth } from './firebase';

const ALLOWED_DOMAIN = 'hbplus.fit';

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const email = user.email?.trim().toLowerCase();

  if (
    !email ||
    !user.emailVerified ||
    email.split('@').length !== 2 ||
    email.split('@')[1] !== ALLOWED_DOMAIN
  ) {
    await signOut(auth);

    throw new Error(
      'Access restricted. Please login using your official domain email.'
    );
  }

  return user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(auth, callback);
}
