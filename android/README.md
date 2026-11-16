# Spent. for Android (Trusted Web Activity)

The Android app is a thin shell that opens the live site (`https://www.spentonline.in`) full screen, so
every website deploy reaches the app immediately. Only the shell (icon, name, splash, version) needs a
new APK. `twa-manifest.json` holds the settings the build tool reads.

## One-time setup

1. Install the tooling: Node 18+, JDK 17, then `npm i -g @bubblewrap/cli`. On first run Bubblewrap offers to download the Android SDK.
2. Create the signing key **once** and back it up somewhere safe (password manager plus an offline copy):
   `keytool -genkeypair -v -keystore spent-release.keystore -alias spent -keyalg RSA -keysize 2048 -validity 10000`
   Losing it means you can never update the installed app again. Never commit it (`.gitignore` blocks it).
3. In `android/`, run `bubblewrap init --manifest=https://www.spentonline.in/manifest.webmanifest` and accept the values already in `twa-manifest.json` (package `in.spentonline.app`, name `Spent.`).
4. Get the key fingerprint: `keytool -list -v -keystore spent-release.keystore -alias spent` and copy the **SHA-256**.
5. Publish it so Android hides the browser address bar: create `public/.well-known/assetlinks.json` in the web app:
   ```json
   [{ "relation": ["delegate_permission/common.handle_all_urls"],
      "target": { "namespace": "android_app", "package_name": "in.spentonline.app",
                  "sha256_cert_fingerprints": ["AA:BB:...:FF"] } }]
   ```
   Deploy, then check `https://www.spentonline.in/.well-known/assetlinks.json` loads without signing in (the sign-in proxy already lets `/.well-known` and `/downloads` through).
6. Decide where the APK is served from: by default `public/downloads/spent.apk` (committed with the release), or set `ANDROID_APK_URL` to host it elsewhere.

## Every release (so it UPDATES the installed app instead of installing a second one)

Android treats a build as an update only when **all three** match:
1. Same package id: `in.spentonline.app` (never change it).
2. Same signing key: always `spent-release.keystore`.
3. Higher version code than the installed one.

Steps:
1. In `twa-manifest.json` raise `appVersionCode` (+1) and `appVersionName`, and put the same name in `startUrl` after `appv=`. The site reads `appv` to know which version is running.
2. `bubblewrap build` (enter the keystore passwords). Take `app-release-signed.apk`.
3. Rename it **`spent.apk`** (always the same file name) and put it at `public/downloads/spent.apk`.
4. In `src/lib/app-release.ts` set `ANDROID_RELEASE.versionName`, `versionCode` and `notes` to match.
5. Commit and deploy. Installed apps check once a day (first open of the day), show "Update available" and offer the download; opening the file installs over the old app.

## How people install the first time

Download `spent.apk` from your site on the phone and open it. Android asks to allow installing from that browser ("Install unknown apps"); allow it once. After that, updates come through the in-app prompt.

## What the app does offline

The service worker (`public/sw.js`) saves the last loaded copy of Home, Transactions, Budgets, Goals, Accounts, Reports, Recurring and Settings. They open instantly on a slow connection and can be read offline, with an "offline, showing saved data" bar. Saved pages are wiped when the user signs out. Adding or editing needs a connection.
