import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';

import { AdminShell } from '@/components/admin/admin-shell';
import { useAuth } from '@/contexts/auth-context';
import { getUserProfileCount } from '@/services/user-profile';

export default function AdminDashboardScreen() {
  const { profile, role, user } = useAuth();
  const [profileCount, setProfileCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadSummary = useCallback(async () => {
    try {
      const count = await getUserProfileCount();
      setProfileCount(count);
      setLoadError('');
    } catch (error: unknown) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Unable to load the user profile count.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  function retrySummary() {
    setLoading(true);
    setLoadError('');
    void loadSummary();
  }

  useEffect(() => {
    let active = true;

    getUserProfileCount()
      .then((count) => {
        if (active) {
          setProfileCount(count);
          setLoadError('');
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Unable to load the user profile count.'
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminShell title="Overview">
      {loadError ? (
        <View style={styles.feedback}>
          <Text accessibilityRole="alert" style={styles.error}>
            {loadError}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={retrySummary}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Registered profiles</Text>
          {loading ? (
            <ActivityIndicator color="#17365D" />
          ) : (
            <Text style={styles.cardValue}>{profileCount ?? '—'}</Text>
          )}
          <Text style={styles.cardHint}>Live Firestore aggregate</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your access</Text>
          <Text style={styles.cardValue}>
            {role === 'admin' ? 'Admin' : 'User'}
          </Text>
          <Text style={styles.cardHint}>Firebase custom-claim verified</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Signed-in account</Text>
          <Text numberOfLines={2} style={styles.accountValue}>
            {profile?.email ?? user?.email ?? 'Unavailable'}
          </Text>
          <Text style={styles.cardHint}>
            {user?.emailVerified ? 'Email verified' : 'Email not verified'}
          </Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>User directory</Text>
        <Text style={styles.panelBody}>
          Browse saved user profiles, search by name or email, and filter by
          profile role metadata. Only trusted Firebase custom claims grant Admin
          access.
        </Text>
        <Link href="/admin/users" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Open user directory</Text>
          </Pressable>
        </Link>
      </View>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  card: {
    flexGrow: 1,
    flexBasis: 230,
    minHeight: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 20,
    justifyContent: 'space-between',
    gap: 10,
  },
  cardLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  cardValue: {
    color: '#142D4E',
    fontSize: 28,
    fontWeight: '800',
  },
  accountValue: {
    color: '#142D4E',
    fontSize: 17,
    fontWeight: '700',
  },
  cardHint: {
    color: '#64748B',
    fontSize: 12,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 22,
    gap: 12,
  },
  panelTitle: {
    color: '#142D4E',
    fontSize: 19,
    fontWeight: '700',
  },
  panelBody: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 760,
  },
  primaryButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#17365D',
    borderRadius: 9,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  feedback: {
    gap: 10,
  },
  error: {
    color: '#B42318',
    backgroundColor: '#FEF3F2',
    borderRadius: 8,
    padding: 12,
  },
  secondaryButton: {
    minHeight: 40,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 9,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#344054',
    fontWeight: '600',
  },
});
