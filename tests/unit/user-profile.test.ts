import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

const mocks = vi.hoisted(() => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: class Timestamp {},
  doc: mocks.doc,
  getCountFromServer: vi.fn(),
  getDoc: mocks.getDoc,
  getDocs: vi.fn(),
  collection: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: mocks.serverTimestamp,
  setDoc: mocks.setDoc,
  startAfter: vi.fn(),
}));

vi.mock('../../src/config/firebase', () => ({ db: {} }));

import { saveUserProfile } from '../../src/services/user-profile';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'profile-uid',
    email: 'person@hbplus.fit',
    displayName: null,
    photoURL: null,
    ...overrides,
  } as User;
}

describe('saveUserProfile', () => {
  const timestampSentinel = { firestoreServerTimestamp: true };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.doc.mockReturnValue({ path: 'users/profile-uid' });
    mocks.serverTimestamp.mockReturnValue(timestampSentinel);
    mocks.setDoc.mockResolvedValue(undefined);
  });

  it('creates a profile with safe optional fields and the default user role', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => false });

    await saveUserProfile(makeUser());

    expect(mocks.setDoc).toHaveBeenCalledOnce();
    const [reference, profile] = mocks.setDoc.mock.calls[0];
    expect(reference).toEqual({ path: 'users/profile-uid' });
    expect(profile).toEqual({
      uid: 'profile-uid',
      email: 'person@hbplus.fit',
      displayName: null,
      photoURL: null,
      role: 'user',
      createdAt: timestampSentinel,
      lastLoginAt: timestampSentinel,
    });
  });

  it('updates profile fields without writing role or createdAt', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => true });

    await saveUserProfile(
      makeUser({ displayName: 'Updated Name', photoURL: 'https://example.test/photo' })
    );

    expect(mocks.setDoc).toHaveBeenCalledOnce();
    const [, profile, options] = mocks.setDoc.mock.calls[0];
    expect(profile).toEqual({
      uid: 'profile-uid',
      email: 'person@hbplus.fit',
      displayName: 'Updated Name',
      photoURL: 'https://example.test/photo',
      lastLoginAt: timestampSentinel,
    });
    expect(profile).not.toHaveProperty('role');
    expect(profile).not.toHaveProperty('createdAt');
    expect(options).toEqual({ merge: true });
  });

  it('propagates Firestore read failures and does not attempt a write', async () => {
    const firestoreError = new Error('Firestore unavailable');
    mocks.getDoc.mockRejectedValue(firestoreError);

    await expect(saveUserProfile(makeUser())).rejects.toBe(firestoreError);
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });
});
