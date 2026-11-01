# Spitiko Customer App

The Spitiko customer app provides the restaurant menu, categories, dish details,
featured items, a shopping cart, WhatsApp order handoff, and table reservations
through the existing WhatsApp request flow. Menu items and the restaurant
WhatsApp number are read from Firebase in real time; staff manage them in the
Spitiko Admin app.

## Setup

Install dependencies in this directory and configure the public Firebase web
app values in `.env`:

```sh
npm install
cp .env.example .env
```

Set the `EXPO_PUBLIC_FIREBASE_*` values from the Firebase web app configuration.
These client values are embedded in the app bundle; never put service-account
credentials or other privileged secrets in `.env`. Set
`EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true` only when using the Emulator Suite.

## Development and build

```sh
npm run web
npm run typecheck
npm run build
```

The static web export is written to `dist/`. Deploy that output to the chosen
static host and configure direct route requests to fall back to `index.html`.
Vercel settings are in `vercel.json`.

The app uses Expo SDK 58. To align Expo packages with the SDK after changing
dependencies, run `npx expo install --fix` from this directory.

## Firebase data

- `menuItems/{itemId}` stores dishes and products. The customer app only shows
  items whose `available` field is `true`.
- `config/whatsapp` stores the restaurant contact number used for WhatsApp
  reservations and order handoff.
- `config/websiteMaintenance` controls the customer site's maintenance screen.

Menu prices are integer cents, and optional offer prices must be lower than
the regular price. Table requests are sent to WhatsApp for staff confirmation;
opening WhatsApp does not itself confirm a reservation.
