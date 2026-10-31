import { useState, type PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import type { UserRole } from '@/services/user-profile';

export function AuthLoadingScreen() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#17365D" />
      <Text style={styles.muted}>Checking your session...</Text>
    </View>
  );
}

function ProfileUnavailableScreen() {
  const { authError, logout, profileError } = useAuth();
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const profileMessage =
    profileError?.message ??
    authError?.message ??
    'Your account profile could not be loaded.';

  async function handleLogout() {
    setSigningOut(true);
    setLogoutError('');

    try {
      await logout();
    } catch (logoutError: unknown) {
      setLogoutError(
        logoutError instanceof Error
          ? logoutError.message
          : 'Unable to log out. Please try again.'
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Profile unavailable</Text>
        <Text accessibilityRole="alert" style={styles.error}>
          {profileMessage}
        </Text>
        {logoutError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {logoutError}
          </Text>
        ) : null}
        <Pressable
          style={styles.button}
          onPress={handleLogout}
          disabled={signingOut}
        >
          <Text style={styles.buttonText}>
            {signingOut ? 'Signing out...' : 'Sign out'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function AuthRedirect() {
  const { loading, profile, profileError, role, user } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!profile || !role || profileError) {
    return <ProfileUnavailableScreen />;
  }

  return (
    <Redirect
      href={role === 'admin' ? '/admin/dashboard' : '/user/dashboard'}
    />
  );
}

type ProtectedRouteProps = PropsWithChildren<{
  role: UserRole;
}>;

export function ProtectedRoute({
  children,
  role: requiredRole,
}: ProtectedRouteProps) {
  const { loading, profile, profileError, role, user } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!profile || !role || profileError) {
    return <ProfileUnavailableScreen />;
  }

  if (role !== requiredRole) {
    return (
      <Redirect
        href={role === 'admin' ? '/admin/dashboard' : '/user/dashboard'}
      />
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  muted: {
    color: '#64748B',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    color: '#142D4E',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  error: {
    color: '#B42318',
    backgroundColor: '#FEF3F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 18,
    width: '100%',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    minHeight: 52,
    backgroundColor: '#17365D',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
