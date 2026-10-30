

import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  loginWithGoogle,
  logout,
  subscribeToAuth,
} from '../config/auth';

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      if (currentUser) {
        const email = currentUser.email?.trim().toLowerCase();
        const allowed =
          currentUser.emailVerified &&
          email?.endsWith('@hbplus.fit');

        if (!allowed) {
          await logout();
          setUser(null);
          setError(
            'Access restricted. Please login using your official domain email.'
          );
        } else {
          setUser(currentUser);
          setError('');
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function handleLogin() {
    setBusy(true);
    setError('');

    try {
      const signedInUser = await loginWithGoogle();
      setUser(signedInUser);
    
    } catch (err: unknown) {
      const firebaseError = err as {
        code?: string;
        message?: string;
      };

      console.error('Google sign-in error:', err);

      setError(
        firebaseError.message ||
        'Authentication failed. Please try again.'
      );
    } finally {
      setBusy(false);
    }

  }

  async function handleLogout() {
    setBusy(true);
    setError('');

    try {
      await logout();
      setUser(null);
    } catch {
      setError('Unable to log out. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#17365D" />
        <Text style={styles.muted}>Checking your session...</Text>
      </View>
    );
  }

  if (user) {
  const firstName = user.displayName?.split(' ')[0] || 'there';

  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'HB';

  return (
    <SafeAreaView style={styles.dashboardContainer}>
      <View style={styles.topbar}>
        <Text style={styles.brandName}>HB+ Workspace</Text>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={busy}
        >
          <Text style={styles.logoutText}>
            {busy ? 'Signing out...' : 'Sign out'}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.dashboardContent}>
        <Text style={styles.eyebrow}>WORKSPACE OVERVIEW</Text>

        <Text style={styles.dashboardTitle}>
          Welcome back, {firstName}.
        </Text>

        <Text style={styles.dashboardSubtitle}>
          Welcome to your HB+ company workspace.
        </Text>

        <View style={styles.welcomePanel}>
          <Text style={styles.panelEyebrow}>YOUR ACCESS</Text>
          <Text style={styles.panelTitle}>You are all set!</Text>
          <Text style={styles.panelDescription}>
            Your company account has been authenticated and authorized.
          </Text>
          <Text style={styles.accessBadgeText}>
            ✓ Authorized access
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Account overview</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ACCESS STATUS</Text>
            <Text style={styles.statValue}>Active</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>EMAIL VERIFICATION</Text>
            <Text style={styles.statValue}>
              {user.emailVerified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>
              {user.displayName || 'HB+ Member'}
            </Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <Text style={styles.profileDomain}>
              Official company account
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
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
          Sign in with your official company Google account
          to access your workspace.
        </Text>

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Pressable
          style={[styles.button, busy && styles.disabled]}
          onPress={handleLogin}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              Continue with Google
            </Text>
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
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#F3F6FA',
  },
  topbar: {
    minHeight: 76,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandName: {
    color: '#142D4E',
    fontWeight: '700',
    fontSize: 19,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 9,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  logoutText: {
    color: '#344054',
    fontWeight: '600',
  },
  dashboardContent: {
    width: '100%',
    maxWidth: 1050,
    alignSelf: 'center',
    padding: 28,
    paddingBottom: 48,
  },
  dashboardTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#142D4E',
    marginTop: 10,
  },
  dashboardSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 28,
  },
  welcomePanel: {
    backgroundColor: '#17365D',
    borderRadius: 18,
    padding: 28,
    marginBottom: 30,
  },
  panelEyebrow: {
    color: '#B9D4F4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  panelTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 12,
  },
  panelDescription: {
    color: '#D7E5F5',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  accessBadgeText: {
    color: '#B7F7CC',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 30,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#142D4E',
    marginTop: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 22,
    gap: 16,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#DCE8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#17365D',
    fontSize: 19,
    fontWeight: '800',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    color: '#142D4E',
    fontSize: 17,
    fontWeight: '700',
  },
  profileEmail: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
  },
  profileDomain: {
    color: '#15803D',
    fontSize: 12,
    marginTop: 7,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
    overflow: 'hidden',
  },
  info: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    padding: 18,
    borderRadius: 12,
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 8,
  },
  email: {
    fontSize: 15,
    color: '#142D4E',
    fontWeight: '600',
    marginBottom: 12,
  },
  status: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '600',
  },
  muted: {
    color: '#64748B',
  },
});
