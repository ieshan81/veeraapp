# VEERA mobile

Native **Expo (React Native)** app with **Expo Router**, **TypeScript**, **Supabase**, **TanStack Query**, **Expo Camera** (QR), and **Expo Notifications**.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. In Supabase, apply the base schema from [`../Reference/schema.sql`](../Reference/schema.sql), then apply the mobile migration:

   [`../supabase/migrations/20250325000000_mobile_app_rls_and_user_tables.sql`](../supabase/migrations/20250325000000_mobile_app_rls_and_user_tables.sql)

   This adds catalog read access for signed-in users, `resolve_plant_qr`, user plant tables, catalog image read policy, and the `user-plant-progress` storage bucket.

4. Enable **Email** auth (or your chosen providers) in the Supabase project.

5. From this **`mobile`** folder (where `package.json` lives), run `npm start`, then open in **Expo Go** or a dev build (`npm run android` / `npm run ios`). Running `expo start` from the repo root without a `package.json` will fail.

### Expo Go compatibility

The project targets **Expo SDK 54** so it matches the **Expo Go** build currently shipped on the App Store / Play Store. If you see *“Project is incompatible with this version of Expo Go”*, your **Expo Go app is older than the SDK the project requested** (or the store hasn’t updated yet). Fix options: update Expo Go from the store, **or** keep the project on SDK 54 as here. For bleeding-edge SDKs before Go catches up, use a **development build** (`expo run:ios` / `expo run:android`) instead of Expo Go.

## Deep linking (plant URLs)

- **HTTPS (production):** `https://veera.yourdomain.com/p/<qr_token>` — update the host in [`app.json`](./app.json) under `ios.associatedDomains` and `android.intentFilters` to your real domain.
- **Custom scheme (dev / QA):** `veera://p/<qr_token>` (same path segment).
- In-app route: `app/p/[token].tsx` resolves the token via `resolve_plant_qr` and opens catalog plant detail. If the user is logged out, the token is stored and resumed after sign-in.

### Server files (host on your domain)

1. **iOS:** `https://veera.yourdomain.com/.well-known/apple-app-site-association` (no extension) — [Apple docs](https://developer.apple.com/documentation/xcode/supporting-associated-domains).
2. **Android:** `https://veera.yourdomain.com/.well-known/assetlinks.json` — [Google App Links](https://developer.android.com/training/app-links).

Use a **development build** to validate universal links; **Expo Go** is easiest to test with the **custom scheme**.

## Product notes

- **QR codes** are created in the admin/backend. The app **scans**, opens **HTTPS / custom links**, and calls `resolve_plant_qr` (with client-side normalization for `/p/<token>` URLs).
- **Purchases**: if `qr_target_url` is set on a plant, the app opens it in the **system browser** (`Linking.openURL`). There is no cart or checkout in the app.
- **Reminders** are scheduled locally with Expo Notifications; times are stored on `user_plants.reminder_time`.

## Stack

Expo SDK **54**, Expo Router, React Native, TypeScript, Supabase JS client with AsyncStorage session persistence, TanStack Query, Expo Camera, Expo Notifications, Expo Image Picker (progress photos).

This is not a Vite or React DOM web app; `react-dom` / web targets may exist as transitive Expo tooling only.
