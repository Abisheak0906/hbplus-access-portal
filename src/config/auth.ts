
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';

import { auth } from './firebase';

export function isAuthorizedUser(user: User): boolean {
  const email = user.email?.trim().toLowerCase();

  if (!email || !user.emailVerified) {
    return false;
  }

  return email.endsWith('@hbplus.fit');
}

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  if (!isAuthorizedUser(user)) {
    await signOut(auth);
    throw new Error(
      'Access restricted. Please login using your official domain email.'
    );
  }

  return user;
}

export async function loginWithGoogleIdToken(
  idToken: string
): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);

  const user = result.user;

  if (!isAuthorizedUser(user)) {
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
