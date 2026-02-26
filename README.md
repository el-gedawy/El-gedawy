# Student Management Web App

A production-ready Firebase web app for teachers and students with role-based dashboards.

## Folder Structure

```text
El-gedawy/
├── .firebaserc
├── firebase.json
├── firestore.rules
├── README.md
└── public/
    ├── index.html
    ├── teacher.html
    ├── student.html
    ├── firebase-messaging-sw.js
    ├── css/
    │   └── styles.css
    └── js/
        ├── firebase-config.js
        ├── pages/
        │   ├── login.js
        │   ├── teacher.js
        │   └── student.js
        ├── services/
        │   ├── auth.js
        │   └── firestore.js
        └── utils/
            └── ui.js
```

## Features Included

- Email/password authentication for teacher and students.
- Role-based route protection.
- Teacher dashboard: groups, students, attendance, points, lectures, notifications, search, stats.
- Student dashboard: attendance history, points summary, lectures, notifications, group details.
- Modular JavaScript with async/await + loading and error handling.
- Firestore-backed data model matching your requested collections.
- Confirmation dialog before lecture deletion.
- Firebase Cloud Messaging setup (token capture + service worker + queue pattern).

## Firebase Setup Instructions

1. Create a Firebase project in Firebase Console.
2. Enable **Authentication > Sign-in method > Email/Password**.
3. Create a **Web App** and copy config values.
4. Replace placeholders in:
   - `public/js/firebase-config.js`
   - `public/firebase-messaging-sw.js`
   - `.firebaserc` (project id)
5. In Firebase Console, create Firestore Database (production mode).
6. Deploy Firestore rules from `firestore.rules`.
7. (For notifications) Generate a Web Push certificate key pair and set `vapidKey` in `public/js/services/firestore.js`.
8. Create one teacher account manually from Firebase Authentication and add teacher profile in Firestore `users/{uid}`:

```json
{
  "name": "Main Teacher",
  "email": "teacher@example.com",
  "role": "teacher"
}
```

## Firestore Database Structure

- `users (id, name, email, role, groupId, createdBy, fcmToken)`
- `groups (id, name, createdBy, createdAt)`
- `attendance (studentId, groupId, date, status, createdAt)`
- `points (studentId, groupId, value, note, createdAt)`
- `lectures (groupId, title, date, content, createdBy, createdAt)`
- `notifications (groupId, title, message, timestamp)`
- `notification_queue (token, title, message, studentId, createdAt)` for Cloud Function fan-out.

## Deployment (Firebase Hosting)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Login:
   ```bash
   firebase login
   ```
3. Initialize project linkage (if needed):
   ```bash
   firebase use --add
   ```
4. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Deploy Hosting:
   ```bash
   firebase deploy --only hosting
   ```

## Optional: Push Notification Delivery

The app stores notification intents in `notification_queue`. For actual push delivery, create a Firebase Cloud Function that listens to queue inserts and sends `admin.messaging().send()` to each token.

