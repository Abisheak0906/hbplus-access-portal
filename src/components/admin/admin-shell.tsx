import { useState, type PropsWithChildren } from 'react';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { useAuth } from '@/contexts/auth-context';

const navigationItems = [
  { href: '/admin/dashboard' as const, label: 'Overview' },
  { href: '/admin/users' as const, label: 'User directory' },
];

export function AdminShell({
  children,
  title,
}: PropsWithChildren<{ title: string }>) {
  const { logout, profile } = useAuth();
  const { width } = useWindowDimensions();
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

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
        <View style={styles.brandBlock}>
          <Text style={styles.eyebrow}>HB+ WORKSPACE</Text>
          <Text style={styles.brand}>Administration</Text>
        </View>
        <View style={styles.accountBlock}>
          <Text numberOfLines={1} style={styles.accountEmail}>
            {profile?.email ?? 'Administrator'}
          </Text>
          <Pressable
            accessibilityRole="button"
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
      </View>

      <View
        style={[
          styles.workspace,
          width < 760 && styles.workspaceCompact,
        ]}
      >
        <View
          accessibilityRole="navigation"
          accessibilityLabel="Admin navigation"
          style={[styles.navigation, width < 760 && styles.navigationCompact]}
        >
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href} asChild>
              <Pressable style={styles.navigationLink}>
                <Text style={styles.navigationText}>{item.label}</Text>
              </Pressable>
            </Link>
          ))}
        </View>

        <View style={styles.main}>
          <Text style={styles.pageTitle}>{title}</Text>
          {logoutError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {logoutError}
            </Text>
          ) : null}
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6FA',
  },
  topbar: {
    minHeight: 78,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  brandBlock: {
    gap: 3,
  },
  eyebrow: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  brand: {
    color: '#142D4E',
    fontSize: 18,
    fontWeight: '800',
  },
  accountBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    maxWidth: '60%',
  },
  accountEmail: {
    color: '#64748B',
    fontSize: 13,
    flexShrink: 1,
  },
  logoutButton: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '600',
  },
  workspace: {
    flex: 1,
    flexDirection: 'row',
  },
  workspaceCompact: {
    flexDirection: 'column',
  },
  navigation: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    padding: 16,
    gap: 6,
  },
  navigationCompact: {
    width: '100%',
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  navigationLink: {
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  navigationText: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '600',
  },
  main: {
    flex: 1,
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    padding: 24,
    gap: 20,
  },
  pageTitle: {
    color: '#142D4E',
    fontSize: 27,
    fontWeight: '800',
  },
  error: {
    color: '#B42318',
    backgroundColor: '#FEF3F2',
    borderRadius: 8,
    padding: 12,
  },
});
