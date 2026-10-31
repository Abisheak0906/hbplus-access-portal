import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

import { AdminShell } from '@/components/admin/admin-shell';
import {
  getUserProfileCount,
  listUserProfiles,
  USER_PROFILE_PAGE_SIZE,
  type UserProfile,
  type UserRole,
} from '@/services/user-profile';

type RoleFilter = 'all' | UserRole;

const roleFilters: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All roles' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

function formatDate(value: UserProfile['createdAt']): string {
  return value.toDate().toLocaleString();
}

export default function AdminUsersScreen() {
  const { width } = useWindowDimensions();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [cursor, setCursor] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [totalProfiles, setTotalProfiles] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadFirstPage = useCallback(async () => {
    try {
      const [page, count] = await Promise.all([
        listUserProfiles(),
        getUserProfileCount(),
      ]);
      setProfiles(page.profiles);
      setCursor(page.nextCursor);
      setTotalProfiles(count);
    } catch (error: unknown) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Unable to load user profiles.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  function reloadProfiles() {
    setLoading(true);
    setLoadError('');
    setProfiles([]);
    setCursor(null);
    setSelectedProfile(null);
    void loadFirstPage();
  }

  useEffect(() => {
    let active = true;

    Promise.all([listUserProfiles(), getUserProfileCount()])
      .then(([page, count]) => {
        if (active) {
          setProfiles(page.profiles);
          setCursor(page.nextCursor);
          setTotalProfiles(count);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Unable to load user profiles.'
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

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      const matchesRole =
        roleFilter === 'all' || profile.role === roleFilter;
      const searchableText = [
        profile.displayName,
        profile.email,
        profile.uid,
      ]
        .filter((value): value is string => Boolean(value))
        .join(' ')
        .toLowerCase();

      return matchesRole && searchableText.includes(normalizedSearch);
    });
  }, [profiles, roleFilter, search]);

  async function loadMore() {
    if (!cursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setLoadError('');

    try {
      const page = await listUserProfiles(cursor);
      setProfiles((currentProfiles) => [
        ...currentProfiles,
        ...page.profiles,
      ]);
      setCursor(page.nextCursor);
    } catch (error: unknown) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Unable to load more user profiles.'
      );
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <AdminShell title="User directory">
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>
          {totalProfiles === null
            ? 'Profile count unavailable'
            : `${totalProfiles} registered profile${totalProfiles === 1 ? '' : 's'}`}
        </Text>
        <Text style={styles.summaryBody}>
          Profile role values are directory metadata only. Admin authorization
          is determined by trusted Firebase custom claims.
        </Text>
      </View>

      <View style={[styles.controls, width < 600 && styles.controlsCompact]}>
        <TextInput
          accessibilityLabel="Search user profiles"
          placeholder="Search loaded profiles by name, email or UID"
          placeholderTextColor="#667085"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          style={styles.searchInput}
        />
        <View
          accessibilityRole="group"
          accessibilityLabel="Filter by profile role"
          style={styles.filters}
        >
          {roleFilters.map((filter) => (
            <Pressable
              key={filter.value}
              accessibilityRole="button"
              accessibilityState={{ selected: roleFilter === filter.value }}
              onPress={() => setRoleFilter(filter.value)}
              style={[
                styles.filterButton,
                roleFilter === filter.value && styles.filterButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  roleFilter === filter.value && styles.filterTextSelected,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loadError ? (
        <View style={styles.errorPanel}>
          <Text accessibilityRole="alert" style={styles.error}>
            {loadError}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={reloadProfiles}
          >
            <Text style={styles.secondaryButtonText}>Reload profiles</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#17365D" />
          <Text style={styles.muted}>Loading profiles from Firestore...</Text>
        </View>
      ) : (
        <View style={[styles.columns, width < 900 && styles.columnsCompact]}>
          <View style={styles.results}>
            <Text style={styles.resultCount}>
              Showing {filteredProfiles.length} matching loaded profile
              {filteredProfiles.length === 1 ? '' : 's'} ({profiles.length}
              {totalProfiles === null ? '' : ` of ${totalProfiles}`} loaded)
            </Text>
            <ScrollView
              style={styles.profileList}
              contentContainerStyle={styles.profileListContent}
            >
              {filteredProfiles.map((profile) => (
                <Pressable
                  key={profile.uid}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${profile.displayName ?? profile.email ?? profile.uid}`}
                  accessibilityState={{
                    selected: selectedProfile?.uid === profile.uid,
                  }}
                  onPress={() => setSelectedProfile(profile)}
                  style={[
                    styles.profileRow,
                    selectedProfile?.uid === profile.uid &&
                      styles.profileRowSelected,
                  ]}
                >
                  <View style={styles.profileIdentity}>
                    <Text style={styles.profileName}>
                      {profile.displayName || 'Name not provided'}
                    </Text>
                    <Text selectable style={styles.profileEmail}>
                      {profile.email || 'Email unavailable'}
                    </Text>
                  </View>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {profile.role === 'admin' ? 'Admin label' : 'User'}
                    </Text>
                  </View>
                </Pressable>
              ))}
              {!filteredProfiles.length && !loadError ? (
                <Text style={styles.emptyState}>
                  No loaded profiles match these filters. Load more profiles or
                  change the search.
                </Text>
              ) : null}
            </ScrollView>

            {cursor ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadMore()}
                disabled={loadingMore}
                style={styles.secondaryButton}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#17365D" />
                ) : (
                  <Text style={styles.secondaryButtonText}>
                    Load more profiles
                  </Text>
                )}
              </Pressable>
            ) : null}
          </View>

          <View style={styles.details}>
            <Text style={styles.detailsTitle}>Profile details</Text>
            {selectedProfile ? (
              <View style={styles.detailsFields}>
                <Detail label="Name" value={selectedProfile.displayName} />
                <Detail label="Email" value={selectedProfile.email} />
                <Detail label="UID" value={selectedProfile.uid} selectable />
                <Detail
                  label="Profile role label"
                  value={selectedProfile.role}
                />
                <Detail
                  label="Profile created"
                  value={formatDate(selectedProfile.createdAt)}
                />
                <Detail
                  label="Last profile login"
                  value={formatDate(selectedProfile.lastLoginAt)}
                />
              </View>
            ) : (
              <Text style={styles.muted}>
                Select a profile to inspect its saved fields.
              </Text>
            )}
          </View>
        </View>
      )}

      <Text style={styles.footer}>
        {USER_PROFILE_PAGE_SIZE} profiles are loaded per page. Search and role
        filters apply to loaded profile metadata, not to custom-claim access.
      </Text>
    </AdminShell>
  );
}

function Detail({
  label,
  selectable,
  value,
}: {
  label: string;
  selectable?: boolean;
  value: string | null;
}) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable={selectable} style={styles.detailValue}>
        {value || 'Not provided'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: '#EDF4FC',
    borderWidth: 1,
    borderColor: '#D6E4F3',
    borderRadius: 12,
    padding: 16,
    gap: 5,
  },
  summaryTitle: {
    color: '#142D4E',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryBody: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 19,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  controlsCompact: {
    alignItems: 'stretch',
  },
  searchInput: {
    flexGrow: 1,
    flexBasis: 280,
    minHeight: 46,
    color: '#142D4E',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 9,
    paddingHorizontal: 13,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  filterButton: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 9,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  filterButtonSelected: {
    backgroundColor: '#17365D',
    borderColor: '#17365D',
  },
  filterText: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#FFFFFF',
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  columnsCompact: {
    flexDirection: 'column',
  },
  results: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  resultCount: {
    color: '#64748B',
    fontSize: 12,
  },
  profileList: {
    maxHeight: 520,
  },
  profileListContent: {
    gap: 8,
  },
  profileRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 13,
  },
  profileRowSelected: {
    borderColor: '#17365D',
    backgroundColor: '#F6F9FD',
  },
  profileIdentity: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: '#142D4E',
    fontWeight: '700',
    fontSize: 14,
  },
  profileEmail: {
    color: '#64748B',
    fontSize: 12,
  },
  roleBadge: {
    backgroundColor: '#EEF2F6',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleText: {
    color: '#344054',
    fontSize: 11,
    fontWeight: '700',
  },
  details: {
    flex: 0.8,
    minWidth: 230,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 17,
    gap: 14,
  },
  detailsTitle: {
    color: '#142D4E',
    fontSize: 16,
    fontWeight: '700',
  },
  detailsFields: {
    gap: 13,
  },
  detail: {
    gap: 4,
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#142D4E',
    fontSize: 13,
    lineHeight: 19,
  },
  loading: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  muted: {
    color: '#64748B',
    fontSize: 13,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    color: '#64748B',
    borderRadius: 10,
    padding: 18,
    lineHeight: 20,
  },
  errorPanel: {
    gap: 8,
  },
  error: {
    color: '#B42318',
    backgroundColor: '#FEF3F2',
    borderRadius: 8,
    padding: 12,
  },
  secondaryButton: {
    minHeight: 42,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
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
  footer: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
});
