# OfficePulse Backend — Starter

This is the first working piece of the backend: one endpoint that saves an
employee check-in to Firestore, plus one to view a user's check-in history.

## What's in this project

```
officepulse-backend/
├── server.js           <- starts the server
├── firebase.js          <- connects to Firebase using your service account key
├── routes/
│   └── checkin.js       <- the /checkin endpoint logic
├── package.json
└── .gitignore
```

## Setup (step by step)

### 1. Install Node.js
If you don't already have it: https://nodejs.org (get the LTS version).
Check it worked by running `node -v` in a terminal.

### 2. Install the project dependencies
Open a terminal inside this folder and run:
```
npm install
```
This downloads Express, Firebase Admin SDK, and the other packages listed
in `package.json`.

### 3. Add your Firebase service account key
You already downloaded this from Firebase console (Project settings ->
Service accounts -> Generate new private key).

- Find the downloaded file (probably in your Downloads folder, named
  something like `officepulse-bauhaven-firebase-adminsdk-xxxxx.json`)
- Rename it to exactly: `serviceAccountKey.json`
- Move it into this project's root folder (same folder as `server.js`)

**Never commit this file to GitHub or share it with anyone.** The
`.gitignore` file included here already excludes it, so `git` won't
accidentally track it.

### 4. Run the server
```
npm start
```
You should see:
```
🚀 OfficePulse backend running at http://localhost:3000
```

### 5. Test it

**Check the server is alive** — open this in your browser:
```
http://localhost:3000
```
You should see: `OfficePulse backend is running ✅`

**Test a check-in** — you'll need a tool that can send a POST request.
The easiest for beginners is a free app called **Postman** (postman.com),
or a VS Code extension called **Thunder Client**.

Send a POST request to:
```
http://localhost:3000/checkin
```
With a JSON body:
```json
{
  "userId": "test-user-1"
}
```
You should get back a success response, and if you check your Firestore
Database in the Firebase console, you'll see a new document appear in a
`checkins` collection.

**View check-ins for that user** — visit in your browser:
```
http://localhost:3000/checkins/test-user-1
```

## What's next

Once this works and you're comfortable with it, we'll add:
- User accounts (so `userId` comes from a real logged-in user, not typed by hand)
- Location verification (so a check-in only counts from the office)
- Authentication middleware to protect these routes (this is where your
  Cybersecurity role really kicks in)
