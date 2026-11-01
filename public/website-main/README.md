# Ora Lodge website

## Structure

```
ora-lodge-site/
├── index.html        Page structure and content (all sections/routes)
├── css/
│   └── style.css      All styling (colors, layout, responsive rules)
├── js/
│   └── script.js       Mobile menu, page router, contact form, footer year
├── images/            Real photos of the lodge, as plain .jpg files
└── README.md          This file
```

## Running it locally

No build step or server required. Just open `index.html` in a browser,
or right-click it and choose "Open with" your browser of choice.

To preview it the way a real host would serve it (recommended before
publishing), run a simple local server from this folder, e.g.:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000` in your browser.

## Before going live

Open `js/script.js` and find the `CONFIG` block near the top:

```js
var CONFIG = {
  phone: "",            // e.g. "+27 82 123 4567"
  email: "",            // e.g. "bookings@oralodge.co.za"
  mapsQuery: "Ora Lodge Ga-Masemola Limpopo"
};
```

Fill in your real phone number and email. They will then appear
automatically in the header and on the Contact page — nothing else
needs to change.

The contact form currently opens the visitor's email app with a
pre-filled message (a `mailto:` link) rather than submitting to a
server, since there's no backend yet. If you want real form
submissions without building a backend yourself, a service like
Formspree or Netlify Forms can usually be wired in with a few lines
in `js/script.js`.

## Making common edits

- **Text** (room descriptions and page copy): edit directly
  in `index.html`. Each page is a `<div class="page" id="page-...">`
  block, so search for the page name (e.g. `id="page-rooms"`) to find
  the right section.
- **Colors and fonts**: edit the CSS variables at the very top of
  `css/style.css` (inside `:root { ... }`). Changing `--brass` there,
  for example, updates every accent color across the whole site.
- **Photos**: add new images to the `images/` folder, then reference
  them in `index.html` with `<img src="images/your-file.jpg" alt="...">`.
  Keep new photos under roughly 300KB each (resize to ~1100px wide,
  save as JPEG at ~65–70% quality) so the site stays fast to load.
- **Adding a page**: add a new `<div class="page" id="page-yourpage">`
  block in `index.html`, then add its route to both the `ROUTES` and
  `TITLES` objects near the top of `js/script.js`, and a link to it
  in the header nav and/or footer.

## Legal pages

Privacy Policy, Terms & Conditions, and Cookies Policy are included as
general templates referencing South African law (POPIA, the Consumer
Protection Act). They are not a substitute for legal advice — have
them reviewed by a South African attorney before relying on them,
especially once real contact details, a booking system, or payment
processing are added.

## Publishing

This is a static site — any standard static host will work (e.g. your
own web server, Netlify, Vercel, GitHub Pages, or a shared hosting
provider that supports plain HTML). Upload the whole folder, keeping
the `css/`, `js/`, and `images/` subfolders intact and their paths
unchanged relative to `index.html`.

In the Expo app, the web route uses this folder for its page design and
loads published room details and rates from Firebase. Keep the copy in
`public/website-main/` in sync when changing the HTML, CSS, or photos.
