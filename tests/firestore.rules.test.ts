import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

const projectId = 'demo-hbplus-portal';
const uid = 'company-user-1';
const email = 'person@hbplus.fit';
let environment: RulesTestEnvironment;

function profileData(
  profileUid = uid,
  profileEmail = email,
  role: 'admin' | 'user' = 'user'
) {
  return {
    uid: profileUid,
    email: profileEmail,
    displayName: 'HB Member',
    photoURL: null,
    role,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  };
}

function authenticatedUser(
  authUid = uid,
  authEmail = email,
  claims: Record<string, unknown> = {}
) {
  return environment.authenticatedContext(authUid, {
    email: authEmail,
    email_verified: true,
    ...claims,
  });
}

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
});

afterAll(async () => {
  await environment.cleanup();
});

describe('users collection security rules', () => {
  it('allows a verified company user to create only a user-role profile at their UID', async () => {
    const db = authenticatedUser().firestore();

    await assertSucceeds(
      setDoc(doc(db, 'users', uid), profileData())
    );
    await assertFails(
      setDoc(doc(db, 'users', 'another-user'), profileData('another-user'))
    );
    await assertFails(
      setDoc(doc(db, 'users', `${uid}-admin`), profileData(`${uid}-admin`, email, 'admin'))
    );
  });

  it('accepts a company domain with mixed case while matching the token email exactly', async () => {
    const mixedCaseEmail = 'person@HBPLUS.FIT';
    const db = authenticatedUser(uid, mixedCaseEmail).firestore();

    await assertSucceeds(
      setDoc(doc(db, 'users', uid), profileData(uid, mixedCaseEmail))
    );
    await assertFails(
      setDoc(doc(db, 'users', `${uid}-mismatch`), profileData(`${uid}-mismatch`, email))
    );
  });

  it('rejects unauthenticated, unverified, and non-company profile creation', async () => {
    const unauthenticatedDb = environment.unauthenticatedContext().firestore();
    const unverifiedDb = environment
      .authenticatedContext(uid, {
        email,
        email_verified: false,
      })
      .firestore();
    const externalDb = authenticatedUser(uid, 'person@gmail.com').firestore();

    await assertFails(
      setDoc(doc(unauthenticatedDb, 'users', uid), profileData())
    );
    await assertFails(setDoc(doc(unverifiedDb, 'users', uid), profileData()));
    await assertFails(
      setDoc(
        doc(externalDb, 'users', uid),
        profileData(uid, 'person@gmail.com')
      )
    );
  });

  it('allows owners to read only their own profile and denies ordinary collection listing', async () => {
    await seedProfile(uid, email);
    const ownerDb = authenticatedUser().firestore();
    const otherDb = authenticatedUser('another-user', 'another@hbplus.fit').firestore();

    await assertSucceeds(getDoc(doc(ownerDb, 'users', uid)));
    await assertFails(getDoc(doc(otherDb, 'users', uid)));
    await assertFails(getDocs(collection(ownerDb, 'users')));
  });

  it('allows profile-field updates but preserves role and creation time', async () => {
    await seedProfile(uid, email);
    const db = authenticatedUser().firestore();

    await assertSucceeds(
      setDoc(
        doc(db, 'users', uid),
        {
          uid,
          email,
          displayName: 'Updated Member',
          photoURL: null,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      )
    );
    await assertFails(
      setDoc(
        doc(db, 'users', uid),
        { role: 'admin', lastLoginAt: serverTimestamp() },
        { merge: true }
      )
    );
    await assertFails(
      setDoc(
        doc(db, 'users', uid),
        { createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() },
        { merge: true }
      )
    );
  });

  it('denies profile deletion and mismatched email updates', async () => {
    await seedProfile(uid, email);
    const db = authenticatedUser().firestore();

    await assertFails(deleteDoc(doc(db, 'users', uid)));
    await assertFails(
      setDoc(
        doc(db, 'users', uid),
        { email: 'other@hbplus.fit', lastLoginAt: serverTimestamp() },
        { merge: true }
      )
    );
  });

  it('allows only a verified company admin claim to list user profiles', async () => {
    await seedProfile(uid, email);
    await seedProfile('another-user', 'another@hbplus.fit');
    const adminDb = authenticatedUser('admin-uid', 'admin@hbplus.fit', {
      admin: true,
    }).firestore();
    const regularDb = authenticatedUser().firestore();
    const externalAdminDb = authenticatedUser('outside-admin', 'admin@gmail.com', {
      admin: true,
    }).firestore();

    const profiles = await assertSucceeds(getDocs(collection(adminDb, 'users')));
    expect(profiles.size).toBe(2);
    await assertFails(getDocs(collection(regularDb, 'users')));
    await assertFails(getDocs(collection(externalAdminDb, 'users')));
  });

  it('denies all access to other collections, including from admins', async () => {
    const adminDb = authenticatedUser('admin-uid', 'admin@hbplus.fit', {
      admin: true,
    }).firestore();

    await assertFails(
      getDoc(doc(authenticatedUser().firestore(), 'privateData', 'one'))
    );
    await assertFails(getDocs(collection(adminDb, 'privateData')));
    await assertFails(
      setDoc(doc(adminDb, 'privateData', 'one'), { value: 'blocked' })
    );
  });
});

async function seedProfile(profileUid: string, profileEmail: string) {
  const createdAt = Timestamp.fromDate(new Date('2024-01-01T00:00:00.000Z'));

  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', profileUid), {
      uid: profileUid,
      email: profileEmail,
      displayName: null,
      photoURL: null,
      role: 'user',
      createdAt,
      lastLoginAt: createdAt,
    });
  });
}
