# 🚀 Pulse Android — Complete Play Store Launch Checklist

> **For the team:** This document tracks everything needed to launch the Pulse app on Google Play Store.
> ✅ = Already done by the AI | 🔴 = Needs YOUR action before submitting

---

## ✅ Already Done (Before This Session)

| Area | Status |
|---|---|
| Capacitor project initialized with `@capacitor/android` | ✅ |
| Android Manifest permissions (Internet, Camera, Location, Storage, Notifications) | ✅ |
| Native Google Auth plugin (`@codetrix-studio/capacitor-google-auth`) integrated | ✅ |
| Login + Register screens use native Google Sign-In on device | ✅ |
| Dedicated mobile app shell (`MobileApp.tsx`) with its own routing | ✅ |
| 6 mobile screens built (Landing, Home, Discover, Records, Trends, Compare) | ✅ |
| Bottom navigation bar with Panic emergency button | ✅ |
| Slide-out drawer navigation | ✅ |
| Safe area insets handled (`env(safe-area-inset-top/bottom)`) | ✅ |
| `minSdkVersion: 24`, `targetSdkVersion: 36`, `compileSdkVersion: 36` (up to date) | ✅ |
| Release build has `minifyEnabled: true` and `shrinkResources: true` | ✅ |

---

## ✅ Completed by AI (June 22, 2026)

| # | Task | File Changed | Status |
|---|---|---|---|
| 1 | Remove cleartext HTTP traffic, enforce HTTPS | `capacitor.config.ts`, `AndroidManifest.xml` | ✅ Done |
| 2 | Add release signing config (reads from env vars, never hardcoded) | `android/app/build.gradle` | ✅ Done |
| 3 | Bump version name to `1.0.0` standard format | `android/app/build.gradle` | ✅ Done |
| 4 | Add ProGuard keep rules for Capacitor, Google Auth & OkHttp | `proguard-rules.pro` | ✅ Done |
| 5 | Add Android hardware **back button** handler (navigates back or minimizes) | `MobileApp.tsx` | ✅ Done |
| 6 | Add **Status Bar** dark theme styling (`#0B0F19`) to match Pulse UI | `MobileApp.tsx` | ✅ Done |
| 7 | Add **Splash Screen** auto-hide with 300ms fade after app loads | `MobileApp.tsx` | ✅ Done |
| 8 | Install `@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen` | `package.json` | ✅ Done |
| 9 | Create `.env.mobile` so Android build always renders mobile UI (not web) | `.env.mobile` | ✅ Done |
| 10 | Add `build:mobile` npm script for the Capacitor build pipeline | `package.json` | ✅ Done |
| 11 | Fix hardcoded "Aryan Sharma" in nav drawer — now shows real logged-in user | `PulseNav.tsx` | ✅ Done |
| 12 | Fix hardcoded fake stats — now fetches real prescription count from API | `HomeScreen.tsx` | ✅ Done |
| 13 | Fix greeting — now shows real user's first name ("Hi, Daksh 👋") | `HomeScreen.tsx` | ✅ Done |
| 14 | Wire up the Logout button in nav drawer — it now actually logs out | `PulseNav.tsx` | ✅ Done |
| 15 | Run `npx cap sync android` — all 5 plugins confirmed registered | Android project | ✅ Done |

---

## ⚠️ Clarification: `google-services.json` — **NOT NEEDED**

> **Note:** Pulse uses **Google Cloud Console OAuth directly**, NOT Firebase Authentication.
> The `google-services.json` file is only needed for Firebase — we don't use Firebase.
>
> Our `capacitor.config.ts` and `strings.xml` already have the Web Client ID hardcoded,
> and the `@codetrix-studio/capacitor-google-auth` plugin uses it directly.

However, native Google Sign-In will still fail on real devices until **Step 1 below** is completed.

---

## 🔴 Remaining Blockers — Needs Friend/Owner Action

### Step 1 — Generate the Release Keystore *(Do this FIRST)*

Run this command **once** on your machine. It creates the cryptographic key that signs your app:

```bash
keytool -genkey -v -keystore pulse-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias pulse
```

> ⚠️ **CRITICAL:** Back up `pulse-release.jks` and the password to a password manager or USB drive.
> If you lose this file, you can **NEVER** update the app on Google Play again. There is no recovery.

---

### Step 2 — Get the SHA-1 Fingerprint from the Keystore

After creating the keystore, run:

```bash
keytool -list -v -keystore pulse-release.jks -alias pulse
```

Copy the **SHA1:** value (looks like `AB:CD:EF:12:34...`). You'll need it in Step 3.

---

### Step 3 — Register Android App in Google Cloud Console

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
3. Application type: **Android**
4. Package name: `com.pulsehealthcare.app`
5. SHA-1 certificate fingerprint: paste the value from Step 2
6. Click **Create**

> This is what allows native Google Sign-In to work on real Android devices.
> Without it, users will see a `DEVELOPER_ERROR (code 10)` when tapping "Sign in with Google".

---

### Step 4 — App Icons

The app currently shows the default Capacitor robot icon on the home screen and Play Store.

**What's needed:** A **1024×1024 PNG** of the Pulse logo with a transparent background.
Send it to the AI and it will auto-generate all Android icon sizes (mdpi → xxxhdpi + adaptive icons).

---

### Step 5 — Privacy Policy Page

Both Login and Register screens link to `/privacy`. Google Play **requires** a live public privacy policy URL before they'll approve the app (because it requests Camera and Location permissions).

- **Check:** Does `https://pulsehealthcare.in/privacy` exist and load?
- **If not:** Ask the AI to build it — it can create a full legal-style privacy policy page.

---

## 📱 How to Build the Release AAB for Play Store

Once Steps 1–5 are done, run these commands:

```bash
# Step 1: Build the web bundle with mobile environment
cd frontend
npm run build:mobile

# Step 2: Copy built files into the Android native project
npx cap sync android

# Step 3: Open Android Studio
npx cap open android
# In Android Studio: Build → Generate Signed Bundle / APK → Android App Bundle (.aab)
# Use the pulse-release.jks keystore you created above
```

Then upload the `.aab` file to the [Google Play Console](https://play.google.com/console).

---

## 🗂️ Key Files Reference

| File | Purpose |
|---|---|
| `frontend/capacitor.config.ts` | Capacitor + plugin config |
| `frontend/android/app/build.gradle` | Version code, signing config |
| `frontend/android/app/src/main/AndroidManifest.xml` | Android permissions |
| `frontend/android/app/proguard-rules.pro` | Release build keep rules |
| `frontend/src/mobile/MobileApp.tsx` | Mobile app entry point + native plugin init |
| `frontend/src/mobile/screens/` | All 8 mobile screens |
| `frontend/.env.mobile` | Environment vars for mobile builds (gitignored) |
| `frontend/package.json` | `npm run build:mobile` script |
