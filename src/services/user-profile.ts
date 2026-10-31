import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db } from '../config/firebase';

export type UserRole = 'admin' | 'user';

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
};

export type UserProfilePage = {
  profiles: UserProfile[];
  nextCursor: QueryDocumentSnapshot<DocumentData> | null;
};

export const USER_PROFILE_PAGE_SIZE = 50;

type UserProfileFields = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastLoginAt: ReturnType<typeof serverTimestamp>;
};

export async function saveUserProfile(user: User): Promise<void> {
  const profileRef = doc(db, 'users', user.uid);
  const existingProfile = await getDoc(profileRef);

  const profile: UserProfileFields = {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    lastLoginAt: serverTimestamp(),
  };

  if (existingProfile.exists()) {
    await setDoc(profileRef, profile, { merge: true });
    return;
  }

  await setDoc(profileRef, {
    ...profile,
    role: 'user',
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(user: User): Promise<UserProfile | null> {
  const profileRef = doc(db, 'users', user.uid);
  const profileSnapshot = await getDoc(profileRef);

  if (!profileSnapshot.exists()) {
    return null;
  }

  const profile = parseUserProfile(profileSnapshot.data(), profileSnapshot.id);

  if (!profile || profile.uid !== user.uid || profile.email !== user.email) {
    throw new Error('The saved user profile is invalid or does not match your account.');
  }

  return profile;
}

export async function listUserProfiles(
  cursor: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<UserProfilePage> {
  const users = collection(db, 'users');
  const profilesQuery = cursor
    ? query(
        users,
        orderBy('createdAt', 'desc'),
        startAfter(cursor),
        limit(USER_PROFILE_PAGE_SIZE)
      )
    : query(users, orderBy('createdAt', 'desc'), limit(USER_PROFILE_PAGE_SIZE));
  const snapshot = await getDocs(profilesQuery);
  const profiles = snapshot.docs.map((profileDocument) => {
    const profile = parseUserProfile(
      profileDocument.data(),
      profileDocument.id
    );

    if (!profile) {
      throw new Error(
        `The user profile ${profileDocument.id} is invalid and cannot be displayed.`
      );
    }

    return profile;
  });

  return {
    profiles,
    nextCursor:
      snapshot.docs.length === USER_PROFILE_PAGE_SIZE
        ? snapshot.docs[snapshot.docs.length - 1]
        : null,
  };
}

export async function getUserProfileCount(): Promise<number> {
  const result = await getCountFromServer(collection(db, 'users'));
  return result.data().count;
}

function parseUserProfile(
  data: DocumentData,
  documentId: string
): UserProfile | null {
  if (
    data.uid !== documentId ||
    !isNullableString(data.email) ||
    !isNullableString(data.displayName) ||
    !isNullableString(data.photoURL) ||
    (data.role !== 'admin' && data.role !== 'user') ||
    !(data.createdAt instanceof Timestamp) ||
    !(data.lastLoginAt instanceof Timestamp)
  ) {
    return null;
  }

  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    role: data.role,
    createdAt: data.createdAt,
    lastLoginAt: data.lastLoginAt,
  };
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}
