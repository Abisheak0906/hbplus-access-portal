# HB+ Access Portal

HB+ Access Portal is a web-first company sign-in portal built with Expo, React Native Web, Firebase Authentication, and Cloud Firestore. It provides Google sign-in, a user profile dashboard, and a claim-protected admin area for viewing saved profiles.

## Objectives and capabilities

- Authenticate through Google and Firebase Authentication.
- Permit signed-in users only when Firebase confirms a verified `@hbplus.fit` email.
- Save a user profile at `users/{uid}` after an authorized sign-in.
- Show account details to users and provide claim-protected admin overview and profile-directory screens.
- Keep authorization enforcement in Firebase Security Rules; browser route guards are navigation controls, not a server-side security boundary.

The admin directory is read-only. Role changes are provisioned by a trusted local Admin SDK script, not by client-side Firestore writes. Account status, invitations, audit logs, and role-based management actions are not implemented.

## Links

- **Live web deployment:** [https://tangerine-tapioca-a65ba5.netlify.app/](https://tangerine-tapioca-a65ba5.netlify.app/)
- **GitHub repository:** [https://github.com/Abisheak0906/hbplus-access-portal](https://github.com/Abisheak0906/hbplus-access-portal)

## Technology

- **React Native** and **React Native Web** for shared cross-platform UI components.
- **Expo SDK 58** and **Expo Router 58** for the toolchain and file-based routes.
- **TypeScript** for application and test code.
- **Firebase Authentication** with Google sign-in.
- **Cloud Firestore** for user profile documents and security rules.
- **Firebase Admin SDK** in a local operator-only script for custom-claim provisioning.
- **Vitest** and Firebase Emulator Suite for unit and rules tests; **Playwright** for browser route checks.

## Project structure

```text
.
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── assets/
│   ├── expo.icon/
│   │   ├── Assets/
│   │   │   ├── expo-symbol 2.svg
│   │   │   └── grid.png
│   │   └── icon.json
│   └── images/
│       ├── android-icon-background.png
│       ├── android-icon-foreground.png
│       ├── android-icon-monochrome.png
│       ├── expo-badge-white.png
│       ├── expo-badge.png
│       ├── expo-logo.png
│       ├── favicon.png
│       ├── icon.png
│       ├── logo-glow.png
│       ├── react-logo.png
│       ├── react-logo@2x.png
│       ├── react-logo@3x.png
│       ├── splash-icon.png
│       ├── tutorial-web.png
│       └── tabIcons/
│           ├── explore.png
│           ├── explore@2x.png
│           ├── explore@3x.png
│           ├── home.png
│           ├── home@2x.png
│           └── home@3x.png
├── e2e/
│   ├── admin-route-guard.spec.ts
│   ├── login.spec.ts
│   └── user-route-guard.spec.ts
├── scripts/
│   ├── manage-admin-claim.cjs
│   └── reset-project.js
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   ├── _layout.tsx
│   │   │   └── admin/
│   │   │       ├── dashboard.tsx
│   │   │       └── users.tsx
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   └── login.tsx
│   │   ├── (user)/
│   │   │   ├── _layout.tsx
│   │   │   └── user/dashboard.tsx
│   │   ├── _layout.tsx
│   │   ├── explore.tsx
│   │   └── index.tsx
│   ├── components/
│   │   ├── admin/admin-shell.tsx
│   │   ├── auth/auth-routing.tsx
│   │   ├── ui/collapsible.tsx
│   │   ├── animated-icon.module.css
│   │   ├── animated-icon.tsx
│   │   ├── animated-icon.web.tsx
│   │   ├── app-tabs.tsx
│   │   ├── app-tabs.web.tsx
│   │   ├── external-link.tsx
│   │   ├── hint-row.tsx
│   │   ├── themed-text.tsx
│   │   ├── themed-view.tsx
│   │   └── web-badge.tsx
│   ├── config/
│   │   ├── auth.ts
│   │   └── firebase.ts
│   ├── constants/theme.ts
│   ├── contexts/auth-context.tsx
│   ├── hooks/
│   │   ├── use-color-scheme.ts
│   │   ├── use-color-scheme.web.ts
│   │   ├── use-google-auth.ts
│   │   └── use-theme.ts
│   ├── services/user-profile.ts
│   └── global.css
├── tests/
│   ├── firestore.rules.test.ts
│   └── unit/
│       ├── auth.test.ts
│       └── user-profile.test.ts
├── app.json
├── eas.json
├── firebase.json
├── firestore.rules
├── eslint.config.js
├── expo-env.d.ts
├── google-services.json
├── LICENSE
├── package-lock.json
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
└── AGENTS.md
```

Expo Router route groups do not appear in public URLs:

| Route | Behavior |
|---|---|
| `/` | Redirects according to the authenticated user's effective role. |
| `/login` | Google sign-in screen; authenticated users are redirected to their dashboard. |
| `/user/dashboard` | User profile and account details. |
| `/admin/dashboard` | Admin overview, including the Firestore profile count. |
| `/admin/users` | Searchable, filterable, paginated, read-only user profile directory. |
| `/explore` | Redirects to `/`, which then applies authentication and role routing. |

The user and admin route-group layouts use a shared guard backed by `AuthProvider`. They show a loading state while authentication/profile checks run, send signed-out users to `/login`, and redirect users with the wrong effective role. Admin route access uses the Firebase ID token's trusted `admin` custom claim. A profile's `role` field is directory metadata and does not grant authorization.

## Prerequisites and installation

- Node.js supported by the installed Expo SDK and project dependencies (Node.js 22 is recommended for the Firebase CLI toolchain).
- npm.
- A Firebase project with Authentication and Cloud Firestore enabled.
- Java 21 or later for the Firestore Emulator used by rules tests.
- Chromium for Playwright browser tests.
- A trusted Google Cloud/Firebase operator credential, stored outside this repository, only when provisioning an admin claim.

Install dependencies and run the web app:

```bash
npm ci
npx expo start --web
```

Alternatively, run the configured `npm run web` script. Expo Router uses `src/app/` for routes.

## Firebase and Google OAuth setup

1. Create or select a Firebase project. Enable **Authentication → Sign-in method → Google** and set its support email.
2. Register a Firebase Web app. The existing web configuration is in `src/config/firebase.ts`; keep the Firebase client configuration for the intended project. It is client configuration, not an Admin SDK credential.
3. In Firebase Authentication **Settings → Authorized domains**, add the local development hostname and `tangerine-tapioca-a65ba5.netlify.app`.
4. Configure the Google OAuth consent screen and web OAuth client. Authorize the application origin and Firebase Auth handler URI shown in Firebase (typically `https://<auth-domain>/__/auth/handler`).
5. Confirm that the Firebase `authDomain` and Google OAuth client belong to the same Firebase/Google Cloud project. The web flow uses Firebase `signInWithPopup`.
6. If testing rules locally, the test command runs the Firestore Emulator with project ID `demo-hbplus-portal`; it does not target the configured production project.
7. Review and deploy `firestore.rules` to the intended Firebase project only after verifying its project ID and rules behavior. No Firebase deployment is performed by this repository's test commands.

### Firestore profile data

The application stores one document per Firebase Authentication UID at `users/{uid}`:

| Field | Meaning |
|---|---|
| `uid` | Firebase Authentication UID and Firestore document ID. |
| `email` | Email from the signed-in Firebase user. |
| `displayName`, `photoURL` | Profile values, or `null` when not supplied. |
| `role` | Profile label, initially `user`; changed by the trusted local provisioning script when an admin claim is granted/revoked. It is not authoritative for access. |
| `createdAt` | Firestore server timestamp set only when creating the profile. |
| `lastLoginAt` | Firestore server timestamp updated after each authorized Google sign-in. |

The client creates the profile only after its verified-domain check passes. Firestore rules independently enforce UID ownership, verified company email, field constraints, immutable role/creation fields for client updates, and no deletes. Only verified company users with the trusted admin custom claim can list profiles. All other collections are denied by these rules. Admins can read the directory but cannot change roles through the client.

The rules file is local source; this task does not inspect or change the rules currently published in Firebase. Until an operator deploys and verifies these rules in the intended Firebase project, do not assume production Firestore is protected by this file.

## Authentication and authorization lifecycle

1. `AuthProvider` subscribes to Firebase with `onAuthStateChanged` and reports a loading state while Firebase resolves the session.
2. The web login action uses Firebase Google popup sign-in. The shared `isAuthorizedUser` function trims and lowercases the email, requires a non-empty email and `emailVerified === true`, and then checks `email.endsWith('@hbplus.fit')`. There is no Gmail development exception.
3. If this client check rejects the account after sign-in, the flow signs the Firebase session out and does not write a profile. This is a user-interface check; Firestore rules repeat server-enforced checks for Firestore access.
4. After authorization succeeds, `saveUserProfile` reads `users/{uid}`. It creates a missing document with `role: 'user'` and `createdAt: serverTimestamp()`, or merges only the UID/email/profile fields and `lastLoginAt` into an existing document. It never writes a role during an update.
5. The auth provider loads and validates the profile, then forces an ID-token refresh and derives the effective role only from the trusted `admin === true` custom claim. A missing or malformed profile and token/Firestore errors are surfaced; the provider does not grant Admin when claim verification fails.
6. The root route sends a signed-out user to `/login`, a regular user to `/user/dashboard`, and an admin to `/admin/dashboard`. Route guards repeat these navigation checks on protected route groups. Firebase Security Rules remain the actual data-access boundary.
7. Unauthorized Firebase sessions are signed out. Login and logout controls show busy states; errors are displayed instead of being silently ignored.

## Trusted admin provisioning

Admin claims are not created or edited by client code. An operator must first have the intended verified `@hbplus.fit` user sign in so that their profile exists. Then, on a trusted workstation:

1. Install/use the project's dependencies with `npm ci`.
2. Store a service-account credential file outside the repository, restrict access to it, and grant only the required Firebase Authentication and Firestore IAM permissions.
3. Set `FIREBASE_PROJECT_ID` to the exact target project and `GOOGLE_APPLICATION_CREDENTIALS` to the external credential path. Never paste the credential JSON into source, `.env`, or a command line.
4. Grant or revoke the custom claim:

   ```bash
   node scripts/manage-admin-claim.cjs grant-admin <firebase-auth-uid>
   node scripts/manage-admin-claim.cjs revoke-admin <firebase-auth-uid>
   ```

The script requires an existing profile and, for grants, checks that the Firebase Auth account is verified and uses the company domain. It preserves unrelated custom claims and synchronizes the profile's role label. The user must sign out and back in to refresh the ID token. The `role` profile field remains non-authoritative; the custom claim is what the route guard and Firestore rules check. Treat service-account credentials as highly sensitive, keep them out of source control, and review the project's IAM policy before running the script.

## User and admin screens

- The user dashboard reads the authenticated user's Firestore profile and displays profile fields, the effective access role, profile creation time, and last profile login.
- The admin overview reads the live Firestore profile count and shows the current administrator's claim-backed access state.
- The admin directory reads user profiles in pages of 50, supports name/email/UID search over loaded pages and role-label filtering, and displays selected profile details.
- The directory is read-only. There is no status, invitation, deletion, or client-side role-management model or action. Search/filter labels describe profile metadata; they do not prove custom claims for every listed account.
- The UI uses React Native components rendered by React Native Web, with compact layouts for narrow screens. Expo Router, auth context, profile services, and screens share code; Google auth has platform-specific handling. This task and its browser validation are web-only and do not validate native builds.

## Run, test, and build

### Web development and static export

```bash
npx expo start --web
npx expo export --platform web
```

The Expo static web export is written to `dist/` (`web.output` is `static` in `app.json`).

### Validation commands

```bash
npx tsc --noEmit
npm run lint
npm run test:unit
npm run test:rules
npx playwright install chromium
npm run test:e2e
npx expo-doctor
```

- Unit tests cover the company-email authorization predicate, unauthorized login sign-out/profile-write behavior, logout delegation, and profile creation/update rules.
- `test:rules` runs against the local Firestore Emulator; it exercises UID ownership, verified company email, immutable roles/timestamps, deletion denial, admin claim listing, and default-deny behavior. It does not deploy rules.
- Playwright tests cover the login screen and anonymous route redirection. They do not authenticate through a real Google account or prove successful company-account login.
- `npx expo-doctor` passed all 20/20 checks after dependency updates.

### Android and iOS configuration

The repository retains Android/iOS Expo configuration, EAS profiles, and the native Google Sign-In plugin. Native development builds are supported by the existing configuration, but native authentication/builds are outside the web-only implementation scope here and were not validated as part of this work. Native Google Sign-In requires a development build rather than Expo Go:

```bash
npx expo run:android
npx expo run:ios
```

The iOS command requires macOS and Xcode. Complete the platform-specific OAuth client, signing, and Firebase app configuration before expecting native sign-in to work.

## Netlify deployment

The current site is deployed using manual Netlify Drop:

1. Build the static web site:

   ```bash
   npx expo export --platform web
   ```

2. Upload the complete generated `dist/` folder using Netlify Drop.
3. Confirm `tangerine-tapioca-a65ba5.netlify.app` is an authorized Firebase Authentication domain and is allowed by the Google OAuth web client.

Live site: [https://tangerine-tapioca-a65ba5.netlify.app/](https://tangerine-tapioca-a65ba5.netlify.app/)

## Validation status and known limitations

- The current revision passed `npx tsc --noEmit`, `npm run lint`, `npm run test:unit` (11 tests), `npm run test:rules` (8 tests), and `npm run test:e2e` (3 browser tests). `npx expo export --platform web` also completed and generated `dist/`; Expo Doctor passed 20/20 checks.
- Dependency installation reported 49 advisories (44 moderate and 5 high). An `npm audit --omit=dev` attempt could not reach the npm registry because DNS resolution failed, so production dependency advisory status remains unverified.
- Successful authentication with a verified `@hbplus.fit` company account has not been tested because no company test account was provided.
- Browser tests do not exercise a signed-in session, Google OAuth popup, logout in an authenticated browser, or claim-backed Admin navigation with a real token.
- The current Firebase project's published Firestore rules were not inspected or deployed by this work. Deploy and verify `firestore.rules` separately before relying on Firestore access restrictions in production.
- Firestore profile role labels may be stale if a trusted provisioning operation partially succeeds. The custom claim remains authoritative for access.
- The application has no custom backend. Client-side checks and route guards can be bypassed and must not be used to protect data or APIs; use Firebase ID-token verification and server-side authorization for any backend, and maintain deployed Firestore rules for Firestore.
- The profile directory is paginated, but search and role filtering apply to profiles loaded into the browser. Account status and operational audit history are not modeled.
- No production deployment, Firebase rules deployment, commit, or push was performed as part of this implementation.

## Security considerations

- Firebase client configuration and `google-services.json` contain client/project identifiers and are not Firebase Admin credentials. Restrict Firebase resources with provider configuration, IAM, and security rules.
- Firebase Authentication manages the session and ID tokens. The app does not create its own token store or backend session.
- Admin authority comes from a Firebase custom claim provisioned by the trusted Admin SDK script. The profile's `role` field is only display/filter metadata.
- Firestore rules bind profile access to the signed-in UID, require a verified company email for profile writes, prohibit self-role changes and deletes, limit admin access to reads/listing, and deny unmatched collections.
- Never commit `.env` files, service-account credentials, private keys, signing secrets, or emulator/test artifacts. The `.gitignore` contains patterns for local environment files, common Firebase service-account files, private keys, emulator data, and test output.
- Email-domain checks in the client are not a substitute for Firebase Security Rules or server-side ID-token verification.
