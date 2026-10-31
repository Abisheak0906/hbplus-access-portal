import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AuthRedirect, AuthLoadingScreen } from '@/components/auth/auth-routing';
import { useAuth } from '@/contexts/auth-context';

export default function LoginScreen() {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const {
    authError,
    loading,
    login,
    profileError,
    ready,
    user,
  } = useAuth();
  const error =
    actionError || profileError?.message || authError?.message || '';

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <AuthRedirect />;
  }

  async function handleLogin() {
    setBusy(true);
    setActionError('');

    try {
      await login();
    } catch (loginError: unknown) {
      setActionError(
        loginError instanceof Error
          ? loginError.message
          : 'Google sign-in failed. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>HB+</Text>
        </View>

        <Text style={styles.eyebrow}>SECURE TEAM ACCESS</Text>
        <Text style={styles.title}>Welcome to HB+</Text>

        <Text style={styles.subtitle}>
          Sign in with your official company Google account to access your
          workspace.
        </Text>

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Pressable
          style={[styles.button, busy && styles.disabled]}
          onPress={handleLogin}
          disabled={busy || !ready}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Continue with Google</Text>
          )}
        </Pressable>

        <Text style={styles.footer}>
          Authorized accounts only · @hbplus.fit
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  logo: {
    backgroundColor: '#17365D',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginBottom: 28,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 12,
  },
  title: {
    color: '#142D4E',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
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
  disabled: {
    opacity: 0.65,
  },
  footer: {
    marginTop: 24,
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
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
});
