const fs = require('node:fs');
const path = require('node:path');
const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const [action, uid] = process.argv.slice(2);
const projectId = process.env.FIREBASE_PROJECT_ID;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

function requireConfiguration() {
  if (action !== 'grant-admin' && action !== 'revoke-admin') {
    throw new Error(
      'Usage: node scripts/manage-admin-claim.cjs <grant-admin|revoke-admin> <firebase-auth-uid>'
    );
  }

  if (!uid) {
    throw new Error('Provide the existing Firebase Authentication UID.');
  }

  if (!projectId || !credentialsPath) {
    throw new Error(
      'Set FIREBASE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS to a trusted credential file stored outside this repository.'
    );
  }

  if (!fs.existsSync(path.resolve(credentialsPath))) {
    throw new Error('The GOOGLE_APPLICATION_CREDENTIALS file was not found.');
  }
}

async function main() {
  requireConfiguration();

  const app = initializeApp({
    credential: applicationDefault(),
    projectId,
  });
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const [user, profileSnapshot] = await Promise.all([
    auth.getUser(uid),
    firestore.collection('users').doc(uid).get(),
  ]);

  if (!profileSnapshot.exists) {
    throw new Error(
      'The user profile does not exist. The user must sign in once before admin access can be granted.'
    );
  }

  if (action === 'grant-admin') {
    const email = user.email?.trim().toLowerCase();
    if (!user.emailVerified || !email?.endsWith('@hbplus.fit')) {
      throw new Error(
        'Only users with a verified @hbplus.fit email can receive the admin claim.'
      );
    }
  }

  const claims = { ...(user.customClaims ?? {}) };
  if (action === 'grant-admin') {
    claims.admin = true;
  } else {
    delete claims.admin;
  }

  await auth.setCustomUserClaims(uid, claims);
  await firestore.collection('users').doc(uid).set(
    { role: action === 'grant-admin' ? 'admin' : 'user' },
    { merge: true }
  );

  console.log(
    `${action === 'grant-admin' ? 'Granted' : 'Revoked'} the admin claim for ${user.email ?? uid} in ${projectId}.`
  );
  console.log('The user must sign out and sign in again to refresh their ID token.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
