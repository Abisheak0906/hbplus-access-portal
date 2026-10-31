import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  getIdTokenResult,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

import { auth } from '../config/firebase';
import {
  isAuthorizedUser,
  logout as firebaseLogout,
} from '../config/auth';
import { useGoogleAuth } from '../hooks/use-google-auth';
import {
  getUserProfile,
  type UserProfile,
  type UserRole,
} from '../services/user-profile';

type AuthContextValue = {
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  authError: Error | null;
  profileError: Error | null;
  ready: boolean;
  login: () => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const loginInProgress = useRef(false);
  const authStateRevision = useRef(0);
  const { login: googleLogin, ready } = useGoogleAuth();

  const clearSignedInState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setRole(null);
    setProfileError(null);
  }, []);

  const loadAuthenticatedUser = useCallback(
    async (currentUser: User) => {
      const revision = ++authStateRevision.current;
      setLoading(true);
      setUser(null);
      setProfile(null);
      setRole(null);
      setAuthError(null);
      setProfileError(null);

      if (!isAuthorizedUser(currentUser)) {
        const error = new Error(
          'Access restricted. Please login using your official domain email.'
        );
        setAuthError(error);
        setLoading(false);

        try {
          await firebaseLogout();
        } catch (signOutError: unknown) {
          setAuthError(
            new Error(
              `${error.message} Sign-out failed: ${toError(signOutError).message}`
            )
          );
        }

        return;
      }

      setUser(currentUser);

      try {
        const userProfile = await getUserProfile(currentUser);

        if (revision !== authStateRevision.current) {
          return;
        }

        if (!userProfile) {
          setProfileError(
            new Error(
              'Your Firestore profile was not found. Sign out and sign in again to create it.'
            )
          );
          return;
        }

        let effectiveRole: UserRole = 'user';

        try {
          const tokenResult = await getIdTokenResult(currentUser, true);
          if (tokenResult.claims.admin === true) {
            effectiveRole = 'admin';
          }
        } catch (tokenError: unknown) {
          if (revision === authStateRevision.current) {
            setAuthError(
              new Error(
                `Could not verify role claims; Admin access is disabled. ${toError(tokenError).message}`
              )
            );
          }
        }

        if (revision !== authStateRevision.current) {
          return;
        }

        setProfile({ ...userProfile, role: effectiveRole });
        setRole(effectiveRole);
      } catch (error: unknown) {
        if (revision === authStateRevision.current) {
          setProfileError(toError(error));
        }
      } finally {
        if (revision === authStateRevision.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (loginInProgress.current) {
          return;
        }

        if (!currentUser) {
          authStateRevision.current += 1;
          clearSignedInState();
          setLoading(false);
          return;
        }

        void loadAuthenticatedUser(currentUser);
      },
      (error) => {
        setAuthError(toError(error));
        clearSignedInState();
        setLoading(false);
      }
    );

    return () => {
      authStateRevision.current += 1;
      unsubscribe();
    };
  }, [clearSignedInState, loadAuthenticatedUser]);

  const login = useCallback(async () => {
    loginInProgress.current = true;
    setAuthError(null);
    setProfileError(null);

    try {
      const signedInUser = await googleLogin();
      await loadAuthenticatedUser(signedInUser);
      return signedInUser;
    } catch (error: unknown) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await loadAuthenticatedUser(currentUser);
      } else {
        authStateRevision.current += 1;
        clearSignedInState();
        setLoading(false);
      }

      setAuthError(toError(error));
      throw error;
    } finally {
      loginInProgress.current = false;
    }
  }, [clearSignedInState, googleLogin, loadAuthenticatedUser]);

  const logout = useCallback(async () => {
    try {
      await firebaseLogout();
      authStateRevision.current += 1;
      clearSignedInState();
      setAuthError(null);
      setLoading(false);
    } catch (error: unknown) {
      const normalizedError = toError(error);
      setAuthError(normalizedError);
      throw normalizedError;
    }
  }, [clearSignedInState]);

  const value = useMemo(
    () => ({
      loading,
      user,
      profile,
      role,
      authError,
      profileError,
      ready,
      login,
      logout,
    }),
    [authError, loading, login, logout, profile, profileError, ready, role, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
