import { Platform } from 'react-native';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  type User,
} from 'firebase/auth';

import { loginWithGoogle as loginWithGoogleWeb } from '../config/auth';
import { auth } from '../config/firebase';

const ALLOWED_DOMAIN = 'hbplus.fit';

if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId:
      '802280960573-nntks5r50n64005pp7ndou4cjuciaa3c.apps.googleusercontent.com',
  });
}

export function useGoogleAuth() {
  async function login(): Promise<User> {
    if (Platform.OS === 'web') {
      return loginWithGoogleWeb();
    }

    await GoogleSignin.hasPlayServices();

    const result = await GoogleSignin.signIn();

    if (!isSuccessResponse(result)) {
      throw new Error('Google sign-in was cancelled.');
    }

    const idToken = result.data.idToken;

    if (!idToken) {
      throw new Error('Google did not return an ID token.');
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const signedIn = await signInWithCredential(auth, credential);
    const user = signedIn.user;

    const email = user.email?.trim().toLowerCase();

    if (
      !email ||
      !user.emailVerified ||
      email.split('@').length !== 2 ||
      email.split('@')[1] !== ALLOWED_DOMAIN
    ) {
      await signOut(auth);
      await GoogleSignin.signOut();
      throw new Error(
        'Access restricted. Please use your official @hbplus.fit account.'
      );
    }

    return user;
  }

  return {
    login,
    ready: true,
  };
}
