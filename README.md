# Spitiko Restaurant & Stay Website

The public website is the Spitiko restaurant storefront: guests can browse the
live menu, filter dishes by category, build a cart, and send an order to the
restaurant through WhatsApp. Table reservation requests also open WhatsApp for
staff confirmation. The existing Ora Lodge stay pages and their booking flow
remain available under **Stay**; saved room requests are not confirmed until
staff updates their status.

## Setup

Run these commands from the repository root:

```sh
npm install
cp website/.env.example website/.env
```

Set the six `EXPO_PUBLIC_FIREBASE_*` values in `website/.env` from the Firebase
project's web app configuration. These values are public client configuration
and are embedded in the site bundle; never put service-account credentials or
other privileged secrets in this file. Set `EXPO_PUBLIC_USE_FIREBASE_EMULATORS`
to `true` only when using the Emulator Suite. The emulator host must be
reachable from the browser.

Start the web app locally:

```sh
npm run start:web
```

Expo Router screens and the root stack are in `website/app/`; screen
styles are colocated with their components.

Build a static site export to `website/dist`:

```sh
npm run build:web
```

## Hosting

The included `vercel.json` rewrites direct room URLs to the exported app entry
point so Expo Router can render dynamic room routes. Set the same Firebase
public environment values in the Vercel project before building, use the
repository root as the project root, and set the build command to
`npm run build:web` and the output directory to `website/dist`.

Firebase Hosting is also configured to serve `website/dist` and rewrite direct
`/room/**` requests to the app entry point. From the repository root, run
`npm run build:web` followed by `firebase deploy --only hosting`.

Run `npm run typecheck --workspace=website` from the root to type-check the
site.

Enable **Anonymous** under **Firebase Console → Authentication → Sign-in
method** (or **Sign-in providers** in the updated console) to save booking
requests directly to Firestore. If it is disabled, the guest can continue
without an account and send the request through WhatsApp, but that request is
not saved to Firestore unless the guest's messaging app successfully sends it.
The displayed quote is calculated in the client and is not a server-verified
price; staff must verify pricing before confirming a request.
