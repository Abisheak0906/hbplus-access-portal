import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/auth-context';

function formatDate(value: Date | null | undefined): string {
  return value ? value.toLocaleString() : 'Not available';
}

export default function UserDashboardScreen() {
  const { logout, profile, role, user } = useAuth();
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const displayName = profile?.displayName ?? user?.displayName ?? null;
  const email = profile?.email ?? user?.email ?? null;
  const firstName = displayName?.split(' ')[0] || 'there';
  const initials = displayName
    ? displayName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'HB';

  async function handleLogout() {
    setSigningOut(true);
    setLogoutError('');

    try {
      await logout();
    } catch (error: unknown) {
      setLogoutError(
        error instanceof Error ? error.message : 'Unable to log out. Please try again.'
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.brandName}>HB+ Workspace</Text>
        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={signingOut}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#344054" />
          ) : (
            <Text style={styles.logoutText}>Sign out</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {logoutError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {logoutError}
          </Text>
        ) : null}
        <Text style={styles.eyebrow}>WORKSPACE OVERVIEW</Text>
        <Text style={styles.title}>Welcome back, {firstName}.</Text>
        <Text style={styles.subtitle}>
          Welcome to your HB+ company workspace.
        </Text>

        <View style={styles.welcomePanel}>
          <Text style={styles.panelEyebrow}>YOUR ACCESS</Text>
          <Text style={styles.panelTitle}>You are all set!</Text>
          <Text style={styles.panelDescription}>
            Your company account has been authenticated and authorized.
          </Text>
          <Text style={styles.accessStatus}>✓ Authorized access</Text>
        </View>

        <Text style={styles.sectionTitle}>Your profile</Text>
        <View style={styles.profileCard}>
          {profile?.photoURL ? (
            <Image
              accessibilityLabel="Profile photo"
              source={{ uri: profile.photoURL }}
              style={styles.photo}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>
              {displayName || 'HB+ Member'}
            </Text>
            <Text style={styles.profileEmail}>
              {email || 'Email unavailable'}
            </Text>
            <Text style={styles.profileDomain}>
              {user?.emailVerified
                ? 'Verified company account'
                : 'Email verification unavailable'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account details</Text>
        <View style={styles.detailsCard}>
          <Detail label="Access role" value={role ?? 'Unavailable'} />
          <Detail
            label="Profile created"
            value={formatDate(profile?.createdAt.toDate())}
          />
          <Detail
            label="Last profile login"
            value={formatDate(profile?.lastLoginAt.toDate())}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  content: {
    width: '100%',
    maxWidth: 1050,
    alignSelf: 'center',
    padding: 28,
    paddingBottom: 48,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    color: '#64748B',
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#142D4E',
    marginTop: 10,
  },
  subtitle: {
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
  accessStatus: {
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
  photo: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#DCE8F6',
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
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 20,
    gap: 16,
  },
  detail: {
    gap: 5,
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#142D4E',
    fontSize: 14,
  },
  error: {
    color: '#B42318',
    backgroundColor: '#FEF3F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 18,
    textAlign: 'center',
  },
});
