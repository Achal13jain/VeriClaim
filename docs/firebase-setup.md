# Firebase Setup

VeriClaim uses Firebase Auth and Firestore for application persistence.

## 1. Create Project

1. Open the Firebase Console.
2. Create a Firebase project.
3. Add a Web app.
4. Copy the Web app config into `.env`.

## 2. Environment Variables

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Restart `npm run dev` after changing env vars.

Make sure `NEXT_PUBLIC_FIREBASE_PROJECT_ID` matches the project where Firestore
rules are deployed. A mismatch commonly appears in the browser as `Missing or
insufficient permissions`.

## 3. Auth

Enable these sign-in providers:

- Google
- Anonymous, optional but useful for demo mode

In **Authentication -> Settings -> Authorized domains**, add:

- `localhost` for local development.
- Your Vercel production domain.
- Any Vercel preview domain you plan to demo from.

New users receive:

- `credits: 100`
- `reputation: 0`
- `badges: []`

## 4. Firestore

Create Firestore in production mode. The app uses these collections:

- `users`
- `specs`
- `agent_runs`
- `challenges`
- `payments`
- `arc_proofs`
- `activity_events`
- `agents`
- `feedback`
- `admins`

Gamification fields live on `users/{uid}`:

- `credits`
- `reputation`
- `badges`
- `stats`
- `activityHistory`
- `freeForgeUsed`
- `totalMockPayments`
- `totalCreditsSpent`

Challenge court documents live in `challenges/{id}` and public feed entries live
in `activity_events/{id}`.

## 5. Deploy Rules

Install Firebase CLI if needed:

```bash
npm install -g firebase-tools
firebase login
firebase use <project-id>
firebase deploy --only firestore:rules
```

The repo rule file is `firestore.rules`. If your local Firebase CLI says it
cannot find `firebase.json`, run `firebase init firestore` and choose the
existing `firestore.rules` file, or keep a local `firebase.json` deploy helper.
The repository does not require committing a project-specific `firebase.json`.

You can deploy without setting an active project by passing the project ID:

```bash
firebase deploy --project <project-id> --only firestore:rules
```

If sign-in works but saving profiles or specs fails with permissions, deploy the
rules again:

```bash
firebase deploy --only firestore:rules
```

Security baseline:

- `specs` are readable by everyone.
- `specs` can be created only by signed-in users where `createdBy` matches their UID.
- `users/{uid}` can be written only by that user.
- `challenges` can be created only by signed-in users.
- `arc_proofs` can be created only by the signed-in publisher and must target
  Arc Testnet with `mode: "mock"` or `mode: "contract"`.
- `activity_events` can be created only by the signed-in actor.
- `payments` are readable only by the signed-in owner and creatable only for
  controlled `forge_unlock` mock receipts or Forge Credit unlocks.
- privileged collections are writable only by admins/server tooling.

## 6. Admins

Privileged writes are denied from the client in the current implementation. Future server/Admin
tooling can create:

```text
admins/{uid}
```

Only existing admins can read admin docs. Admin writes are disabled from the client.

## 7. Known Limitations

- Firebase Admin SDK is intentionally not used yet.
- Credits, reputation, challenge rewards, mock payments, and mock Arc proof
  writes are demo-safe client flows protected by Firestore rules, not
  production-grade server authority.
- `agent_runs` writes are denied from the browser by security rules, so the
  current client embeds the agent trace in `specs/{hash}` and attempts a
  best-effort `agent_runs` write only if local rules allow it.
- Challenge rewards are applied through the client transaction helper until an
  Admin/API reward service is added.
- Arc proof publishing and x402 payments currently use mock-mode flows; agent
  registry writes remain mock-mode flows until server-side services are added.
