
## 2026-08-23
- Provisioned Firebase with Firestore and Auth.
- Created `firebase-blueprint.json` specifying the schema for `User` (preferences) and `SavedEvent`.
- Drafted, verified (with eslint), and deployed `firestore.rules` adhering to the rules specification (ABAC, tight schema checks).
- Added `firebase.ts` client with initialization logic, Google Provider, and standard error handling.
- Patched `App.tsx` to handle `onAuthStateChanged`, sync `userPreferences` and `savedEvents` from Firestore on login, and write to Firestore when saving events or updating read times.
- Updated top navigation bar to include a "Sign In" button via `signInWithPopup`, and an avatar for the signed-in user.
- Verified build succeeds locally.
- Enabled Firestore offline persistence using \`persistentLocalCache\` to allow reading saved events offline.
- Added a "Download" button in \`ArticleReader\` to allow users to export the intelligence brief as a markdown file for offline reading.
