# Molemi's Certification Inventory

A public showcase of **every** certificate I've earned: technical skills, AI, work readiness, soft skills and more. LinkedIn holds my key professional certificates; this site holds the complete collection.

**Live site:** https://mo-lemi.github.io/Molemi-s-Certification-Inventory/

## Features

- Card grid of certificates with previews of images (PNG/JPG/SVG) and PDFs (first page rendered in the browser with PDF.js)
- Filter by category, search by title/issuer/skill, sort by featured, newest, oldest or A–Z
- Detail view with issuer, dates, credential ID, skills and a **Verify** button
- Shareable links to a single certificate, e.g. `…/#sample-java-basic`
- ★ Featured certificates shown first
- Expired certificates are flagged automatically
- Build-time checks catch mistakes in the data file (typos, missing files, bad dates)

## Tech stack

| Tool | Used for |
| --- | --- |
| [Astro](https://astro.build) | Static site framework (components + build) |
| TypeScript | Typed data and browser scripts |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [PDF.js](https://mozilla.github.io/pdf.js/) | PDF previews |
| GitHub Actions + GitHub Pages | Automatic free hosting |

## Adding a certificate

1. Put the certificate file in [`public/certificates/`](public/certificates/). Use lowercase names with dashes, e.g. `hackerrank-java-basic.pdf`. Skip this step if it's a link-only certificate.
2. Add an entry to [`src/data/certificates.json`](src/data/certificates.json):

   ```json
   {
     "id": "hackerrank-java-basic",
     "title": "Java (Basic)",
     "issuer": "HackerRank",
     "category": "technical",
     "dateEarned": "2025-08-14",
     "expiryDate": null,
     "credentialId": "ABC123XYZ",
     "verifyUrl": "https://www.hackerrank.com/certificates/abc123xyz",
     "file": "certificates/hackerrank-java-basic.pdf",
     "skills": ["Java", "OOP"],
     "featured": false
   }
   ```

   | Field | Required | Notes |
   | --- | --- | --- |
   | `id` | yes | Unique, lowercase-with-dashes. Used in share links. |
   | `title`, `issuer` | yes | |
   | `category` | yes | Must match an `id` in [`src/data/categories.json`](src/data/categories.json) |
   | `dateEarned` | yes | `YYYY-MM-DD` |
   | `expiryDate` | no | `YYYY-MM-DD` or `null` |
   | `credentialId`, `verifyUrl` | no | `null` if there isn't one |
   | `file` | no | Path inside `public/`, or `null` for link-only certificates |
   | `skills` | no | List of tags, searchable |
   | `featured` | no | `true` to pin it to the top with a ★ |

3. Run `npm run dev` to check it, then commit and push. The site redeploys automatically.

**Adding a category:** add `{ "id": "...", "label": "...", "color": "#hex" }` to `src/data/categories.json`.

**Profile details** (tagline, photo, LinkedIn, email) are in [`src/data/profile.json`](src/data/profile.json). For a photo, put e.g. `profile.jpg` in `public/` and set `"photo": "profile.jpg"`.

## Running locally

```bash
npm install      # first time only
npm run dev      # start dev server at http://localhost:4321/Molemi-s-Certification-Inventory/
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Deployment

Pushing to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the site and publishes it to GitHub Pages.

One-time setup: on GitHub go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

## Project structure

```
public/
  certificates/        certificate files (PDF, PNG, JPG, SVG)
  favicon.svg
src/
  data/                certificates.json, categories.json, profile.json  ← edit these
  lib/certificates.ts  loads + validates the data, shared helpers
  components/          Header, CertificateCard, CertificateDetail, Preview
  scripts/             browser code: filtering/sorting/dialog, PDF previews
  pages/index.astro    the page itself
  styles/global.css    theme colours and fonts
```

## Roadmap

- [ ] Replace the sample certificates with real ones
- [ ] Add profile photo, LinkedIn and email
- [ ] More filters (issuer, skill, year) as the collection grows
- [ ] Upload form / admin area (app-like version)
- [ ] Grow into a full portfolio site with a custom domain

## Learning journal

I'm documenting what I learn while building this in [LEARNING_JOURNAL.md](LEARNING_JOURNAL.md).
