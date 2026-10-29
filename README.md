# Highland Park Lanes — website

A modern, mobile-first, accessible rebuild of [highlandparklanes.com](https://www.highlandparklanes.com/)
(bowling, 59th Avenue Grill, Sandbagger Lounge, golf simulators and pro shop in Greeley, CO).
All original content, pages and URL slugs are retained.

## Highlights
- Static HTML/CSS/JS, no framework or runtime dependencies — host anywhere (GitHub Pages, Netlify, etc.).
- Responsive layout, sticky mobile "Call" button, accessible disclosure navigation.
- WCAG-minded: skip link, semantic landmarks, visible focus, sufficient contrast, labelled forms with
  inline error messages, `prefers-reduced-motion` support. All pages pass axe-core with no violations.
- Grill menu transcribed from images into real, searchable text (original menu boards still available).
- Optimized images (WebP + JPEG fallback) and the 15 MB lounge GIF replaced by a ~650 KB video.
- Today's row is highlighted in the hours tables; JSON-LD `BowlingAlley` structured data; sitemap.

## Structure
```
src/site.json      Site settings (phone, form endpoint, base path, URL)
src/layout.html    Shared header / footer / <head>
src/pages/*.html   Page content (front matter + HTML)
assets/            CSS, JS, images, video, files
build.mjs          Builds src/ into index.html, <slug>/index.html, 404.html, sitemap.xml
```
Generated HTML files are committed so the site can be served directly. **Edit `src/`, not the generated files.**

## Build & preview
Requires Node 18+.
```sh
node build.mjs
python3 -m http.server 8000   # then open http://localhost:8000
```

## Configuration
- **Forms** (party booking, specials sign-up, tournament, junior & league sign-ups): the old Wix backend can't be
  carried over. Set `formEndpoint` in `src/site.json` to a form service URL (e.g. Formspree) and rebuild. Each
  submission includes a hidden `form` field identifying which form was used. Until configured, forms validate
  and then ask visitors to call.
- **Hosting under a sub-path** (e.g. GitHub Pages project site): set `basePath` to `/highland-website/`
  (used by `404.html`); all other pages use relative links.

## Content to confirm with the owner
These inconsistencies exist on the original site and were preserved as-is:
- Open hours: Home says Sun–Thu 10am–10pm, Fri 10am–11pm, Sat 9am–11pm; Bowl page says Tue/Wed 8am–10pm and Fri/Sat 10am–12am.
- Friday open bowling: Home "2pm–5:30pm & 10pm–12am" vs. Bowl "10am–12pm, 2pm–5:30pm, 10pm–12am".
- Cosmic bowling: Bowl page Fri 9:30pm–Midnight / Sat Noon–Midnight vs. Parties page Fri 9–11pm / Sat Noon–11pm.
- Tournament years are assumed to be Sep–Nov 2026 and Feb–May 2027.
