# Firebase Setup

VeriClaim uses Firebase Auth and Firestore for MVP persistence.

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

## 3. Auth

Enable these sign-in providers:

- Google
- Anonymous, optional but useful for demo mode

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

## 5. Deploy Rules

Install Firebase CLI if needed:

```bash
npm install -g firebase-tools
firebase login
firebase use <project-id>
firebase deploy --only firestore:rules
```

The repo rule file is `firestore.rules`.

Security baseline:

- `specs` are readable by everyone.
- `specs` can be created only by signed-in users where `createdBy` matches their UID.
- `users/{uid}` can be written only by that user.
- `challenges` can be created only by signed-in users.
- privileged collections are writable only by admins/server tooling.

## 6. Admins

To allow privileged writes in MVP tooling, create:

```text
admins/{uid}
```

Only existing admins can read admin docs. Admin writes are disabled from the
client; create admin docs through trusted console/server tooling.
