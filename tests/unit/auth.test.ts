import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

const mocks = vi.hoisted(() => ({
  credential: vi.fn(),
  saveUserProfile: vi.fn(),
  setCustomParameters: vi.fn(),
  signInWithCredential: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class {
    static credential = mocks.credential;
    setCustomParameters = mocks.setCustomParameters;
  },
  onAuthStateChanged: vi.fn(),
  signInWithCredential: mocks.signInWithCredential,
  signInWithPopup: mocks.signInWithPopup,
  signOut: mocks.signOut,
}));

vi.mock('../../src/config/firebase', () => ({ auth: {} }));
vi.mock('../../src/services/user-profile', () => ({
  saveUserProfile: mocks.saveUserProfile,
}));

import {
  isAuthorizedUser,
  loginWithGoogle,
  logout,
} from '../../src/config/auth';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'test-uid',
    email: 'member@hbplus.fit',
    emailVerified: true,
    displayName: 'HB Member',
    photoURL: null,
    ...overrides,
  } as User;
}

describe('company account authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts a verified company address after trimming and case normalization', () => {
    expect(
      isAuthorizedUser(
        makeUser({ email: '  MEMBER@HBPLUS.FIT  ', emailVerified: true })
      )
    ).toBe(true);
  });

  it.each([
    ['unverified company address', { emailVerified: false }],
    ['Gmail address', { email: 'member@gmail.com' }],
    ['missing address', { email: null }],
    ['lookalike suffix', { email: 'member@hbplus.fit.attacker.test' }],
  ])('rejects %s', (_description, overrides) => {
    expect(isAuthorizedUser(makeUser(overrides))).toBe(false);
  });

  it('does not save an unauthorized Google account and signs it out', async () => {
    const user = makeUser({ email: 'member@gmail.com' });
    mocks.signInWithPopup.mockResolvedValue({ user });
    mocks.signOut.mockResolvedValue(undefined);

    await expect(loginWithGoogle()).rejects.toThrow(
      'Access restricted. Please login using your official domain email.'
    );

    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.saveUserProfile).not.toHaveBeenCalled();
  });

  it('saves an authorized account once after sign-in', async () => {
    const user = makeUser();
    mocks.signInWithPopup.mockResolvedValue({ user });
    mocks.saveUserProfile.mockResolvedValue(undefined);

    await expect(loginWithGoogle()).resolves.toBe(user);
    expect(mocks.saveUserProfile).toHaveBeenCalledOnce();
    expect(mocks.saveUserProfile).toHaveBeenCalledWith(user);
  });

  it('delegates logout to Firebase Authentication', async () => {
    mocks.signOut.mockResolvedValue(undefined);

    await logout();

    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
});
