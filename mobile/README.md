# FLYApp Mobile (iOS + Android)

This is the new native mobile application foundation for FLYApp, built with Expo and React Native. It is intentionally separate from the existing web app while the migration is underway.

## Run locally

1. Install Node.js LTS and the Expo Go app on a test phone, or use an iOS Simulator / Android emulator.
2. From this folder, run `npm install`.
3. Copy `.env.example` to `.env` and fill in the Firebase **web app configuration** values (these are client configuration values, not service-account credentials).
4. Enable Email/Password in Firebase Console → Authentication → Sign-in method.
5. Run `npm start` and follow the Expo instructions.

## Current scope

- Expo project foundation for iOS and Android.
- Firebase Authentication client configured for React Native with persisted sessions.
- Sign-in / account creation UI.
- Push notification permission/token registration scaffold.
- A protected API client placeholder for the server backend.

## Important migration notes

- This mobile app does not use the Base44 SDK.
- The existing web app and Base44 dependencies are left intact temporarily so working code is not destructively removed before mobile parity is achieved. Remove the legacy web app and Base44 packages only after all required screens, server functions, and workflows have been migrated and tested.
- Google Sheets credentials must remain server-side. Never put the Apps Script API key or other private backend secrets in an `EXPO_PUBLIC_*` variable.
- Push notification delivery requires an Expo EAS project, platform credentials, a server-side sender, and real-device testing. A device token alone does not send notifications.
- The current app screen is a foundation, not the completed FLYApp product. Event data and role-based dashboards still need to be connected to the protected API.

## Build for app stores

After configuring EAS and the iOS/Android signing credentials, use Expo Application Services to create store builds. App Store and Google Play developer accounts and review approval are required for publication.
